import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def encrypt_data(data: bytes) -> tuple[bytes, bytes, bytes]:
    """
    Encrypts bytes using AES-256 GCM.
    Returns: (encrypted_data_with_tag, key, iv)
    """
    key = os.urandom(32)  # 256-bit key
    iv = os.urandom(12)   # 96-bit IV for GCM
    
    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()
    
    ciphertext = encryptor.update(data) + encryptor.finalize()
    tag = encryptor.tag
    
    # Store tag and ciphertext together
    # GCM tag is exactly 16 bytes
    return tag + ciphertext, key, iv

def decrypt_data(encrypted_data: bytes, key: bytes, iv: bytes) -> bytes:
    """
    Decrypts bytes using AES-256 GCM.
    Expects encrypted_data to start with a 16-byte tag.
    """
    if len(encrypted_data) < 16:
        raise ValueError("Invalid encrypted data length.")
        
    tag = encrypted_data[:16]
    ciphertext = encrypted_data[16:]
    
    decryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv, tag),
        backend=default_backend()
    ).decryptor()
    
    return decryptor.update(ciphertext) + decryptor.finalize()

def encrypt_to_b64_strings(data: bytes) -> tuple[str, str, str]:
    """
    Helper to encrypt data and return base64 encoded strings
    suitable for database CharField storage.
    Returns: (encrypted_b64, key_b64, iv_b64)
    """
    enc_bytes, key_bytes, iv_bytes = encrypt_data(data)
    
    enc_b64 = base64.b64encode(enc_bytes).decode('utf-8')
    key_b64 = base64.b64encode(key_bytes).decode('utf-8')
    iv_b64 = base64.b64encode(iv_bytes).decode('utf-8')
    
    return enc_b64, key_b64, iv_b64

def decrypt_from_b64_strings(enc_b64: str, key_b64: str, iv_b64: str) -> bytes:
    """
    Helper to decrypt from base64 encoded strings stored in DB.
    """
    enc_bytes = base64.b64decode(enc_b64.encode('utf-8'))
    key_bytes = base64.b64decode(key_b64.encode('utf-8'))
    iv_bytes = base64.b64decode(iv_b64.encode('utf-8'))
    
    return decrypt_data(enc_bytes, key_bytes, iv_bytes)
