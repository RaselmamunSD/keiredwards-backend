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
