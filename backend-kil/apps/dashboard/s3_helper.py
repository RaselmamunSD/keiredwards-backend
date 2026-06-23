import os
import boto3
import logging
from django.conf import settings
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

def get_s3_client(bucket_num):
    """
    Initializes and returns a boto3 client for the given bucket number's region.
    """
    access_key = getattr(settings, "IDRIVE_E2_ACCESS_KEY", "")
    secret_key = getattr(settings, "IDRIVE_E2_SECRET_KEY", "")
    
    if not access_key or not secret_key:
        return None
        
    bucket_config = settings.IDRIVE_E2_BUCKETS.get(bucket_num)
    if not bucket_config:
        return None
        
    endpoint_url = bucket_config["endpoint"]
    
    try:
        # Create standard S3 client pointing to IDrive e2 endpoint
        session = boto3.session.Session()
        s3_client = session.client(
            service_name="s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url
        )
        return s3_client
    except Exception as e:
        logger.error(f"Failed to initialize boto3 client for bucket {bucket_num}: {e}")
        return None

def upload_file_bytes(file_data: bytes, bucket_num: int, unique_filename: str) -> tuple[bool, str]:
    """
    Uploads encrypted bytes to IDrive e2 S3 or falls back to local storage.
    Returns: (is_cloud, path_or_key)
    """
    bucket_config = settings.IDRIVE_E2_BUCKETS.get(bucket_num)
    s3_client = get_s3_client(bucket_num)
    
    if s3_client and bucket_config:
        bucket_name = bucket_config["bucket_name"]
        try:
            # Try uploading to S3
            logger.info(f"Uploading file {unique_filename} to IDrive e2 S3 bucket {bucket_name} ({bucket_config['region_code']})...")
            
            # Put object directly using bytes payload
            s3_client.put_object(
                Bucket=bucket_name,
                Key=unique_filename,
                Body=file_data
            )
            return True, f"s3://{bucket_name}/{unique_filename}"
        except (BotoCoreError, ClientError) as e:
            logger.error(f"IDrive e2 S3 upload failed, falling back to local storage: {e}")
            
    # Fallback to local storage
    storage_base_dir = settings.BASE_DIR / "vault_storage"
    bucket_dir = storage_base_dir / f"storage_{bucket_num}"
    os.makedirs(bucket_dir, exist_ok=True)
    
    local_path = str(bucket_dir / unique_filename)
    with open(local_path, "wb") as f:
        f.write(file_data)
        
    return False, local_path

def download_file_bytes(encrypted_file_path: str, bucket_num: int) -> bytes:
    """
    Downloads file bytes from S3 (if path starts with s3://) or local disk.
    """
    if encrypted_file_path.startswith("s3://"):
        # Format: s3://bucket_name/key
        parts = encrypted_file_path[5:].split("/", 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid S3 path format: {encrypted_file_path}")
            
        bucket_name, key = parts
        s3_client = get_s3_client(bucket_num)
        
        if not s3_client:
            raise ValueError("IDrive e2 S3 credentials not configured but file is stored in cloud.")
            
        try:
            logger.info(f"Downloading file {key} from S3 bucket {bucket_name}...")
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            return response["Body"].read()
        except (BotoCoreError, ClientError) as e:
            raise OSError(f"Failed to fetch file from IDrive e2 S3: {e}")
    else:
        # Local file path
        if not os.path.exists(encrypted_file_path):
            raise FileNotFoundError(f"Local encrypted file not found: {encrypted_file_path}")
            
        with open(encrypted_file_path, "rb") as f:
            return f.read()

def delete_file(encrypted_file_path: str, bucket_num: int) -> bool:
    """
    Deletes the file from S3 or local disk.
    """
    if encrypted_file_path.startswith("s3://"):
        parts = encrypted_file_path[5:].split("/", 1)
        if len(parts) != 2:
            return False
            
        bucket_name, key = parts
        s3_client = get_s3_client(bucket_num)
        
        if not s3_client:
            return False
            
        try:
            logger.info(f"Deleting file {key} from S3 bucket {bucket_name}...")
            s3_client.delete_object(Bucket=bucket_name, Key=key)
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False
    else:
        if os.path.exists(encrypted_file_path):
            try:
                os.remove(encrypted_file_path)
                return True
            except OSError:
                pass
        return False


def upload_file_stream(file_obj, bucket_num: int, unique_filename: str, key_bytes: bytes, iv_bytes: bytes) -> tuple[bool, str]:
    """
    Encrypts and uploads a file-like object stream to S3 (via multipart upload) or local storage.
    Returns: (is_cloud, path_or_key)
    """
    import base64
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend

    bucket_config = settings.IDRIVE_E2_BUCKETS.get(bucket_num)
    s3_client = get_s3_client(bucket_num)
    
    if s3_client and bucket_config:
        bucket_name = bucket_config["bucket_name"]
        try:
            logger.info(f"Streaming upload {unique_filename} to S3 bucket {bucket_name}...")
            mp = s3_client.create_multipart_upload(Bucket=bucket_name, Key=unique_filename)
            upload_id = mp['UploadId']
            parts = []
            part_number = 1
            
            cipher = Cipher(algorithms.AES(key_bytes), modes.CTR(iv_bytes), backend=default_backend())
            encryptor = cipher.encryptor()
            
            try:
                while True:
                    chunk = file_obj.read(8 * 1024 * 1024)  # 8MB chunks
                    if not chunk:
                        break
                    
                    encrypted_chunk = encryptor.update(chunk)
                    if encrypted_chunk:
                        response = s3_client.upload_part(
                            Bucket=bucket_name,
                            Key=unique_filename,
                            PartNumber=part_number,
                            UploadId=upload_id,
                            Body=encrypted_chunk
                        )
                        parts.append({'PartNumber': part_number, 'ETag': response['ETag']})
                        part_number += 1
                
                final_chunk = encryptor.finalize()
                if final_chunk:
                    response = s3_client.upload_part(
                        Bucket=bucket_name,
                        Key=unique_filename,
                        PartNumber=part_number,
                        UploadId=upload_id,
                        Body=final_chunk
                    )
                    parts.append({'PartNumber': part_number, 'ETag': response['ETag']})
                
                s3_client.complete_multipart_upload(
                    Bucket=bucket_name,
                    Key=unique_filename,
                    UploadId=upload_id,
                    MultipartUpload={'Parts': parts}
                )
                return True, f"s3://{bucket_name}/{unique_filename}"
            except Exception as e:
                s3_client.abort_multipart_upload(
                    Bucket=bucket_name,
                    Key=unique_filename,
                    UploadId=upload_id
                )
                raise e
        except Exception as e:
            logger.error(f"IDrive e2 S3 streaming upload failed, falling back to local storage: {e}")
            # Reset file pointer to beginning for fallback
            try:
                file_obj.seek(0)
            except Exception:
                pass
            
    # Fallback to local storage
    storage_base_dir = settings.BASE_DIR / "vault_storage"
    bucket_dir = storage_base_dir / f"storage_{bucket_num}"
    os.makedirs(bucket_dir, exist_ok=True)
    
    local_path = str(bucket_dir / unique_filename)
    
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    
    cipher = Cipher(algorithms.AES(key_bytes), modes.CTR(iv_bytes), backend=default_backend())
    encryptor = cipher.encryptor()
    
    with open(local_path, "wb") as dest:
        while True:
            chunk = file_obj.read(8 * 1024 * 1024)
            if not chunk:
                break
            dest.write(encryptor.update(chunk))
        dest.write(encryptor.finalize())
        
    return False, local_path


def stream_decrypted_file(encrypted_file_path: str, bucket_num: int, key_b64: str, iv_b64: str):
    """
    Generator yielding decrypted chunks of the file from S3 or local storage.
    Supports legacy AES-GCM (12-byte IV) and streaming AES-CTR (16-byte IV).
    """
    import base64
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend

    key_bytes = base64.b64decode(key_b64.encode('utf-8'))
    iv_bytes = base64.b64decode(iv_b64.encode('utf-8'))
    
    is_gcm = len(iv_bytes) == 12
    
    if is_gcm:
        from .crypto import decrypt_data
        if encrypted_file_path.startswith("s3://"):
            parts = encrypted_file_path[5:].split("/", 1)
            bucket_name, key = parts
            s3_client = get_s3_client(bucket_num)
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            enc_bytes = response["Body"].read()
        else:
            with open(encrypted_file_path, "rb") as f:
                enc_bytes = f.read()
        yield decrypt_data(enc_bytes, key_bytes, iv_bytes)
    else:
        cipher = Cipher(algorithms.AES(key_bytes), modes.CTR(iv_bytes), backend=default_backend())
        decryptor = cipher.decryptor()
        
        if encrypted_file_path.startswith("s3://"):
            parts = encrypted_file_path[5:].split("/", 1)
            bucket_name, key = parts
            s3_client = get_s3_client(bucket_num)
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            stream = response["Body"]
            
            while True:
                chunk = stream.read(8 * 1024 * 1024)
                if not chunk:
                    break
                dec_chunk = decryptor.update(chunk)
                if dec_chunk:
                    yield dec_chunk
            dec_final = decryptor.finalize()
            if dec_final:
                yield dec_final
        else:
            with open(encrypted_file_path, "rb") as f:
                while True:
                    chunk = f.read(8 * 1024 * 1024)
                    if not chunk:
                        break
                    dec_chunk = decryptor.update(chunk)
                    if dec_chunk:
                        yield dec_chunk
                dec_final = decryptor.finalize()
                if dec_final:
                    yield dec_final
