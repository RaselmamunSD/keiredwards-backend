import requests
import urllib.parse
from django.conf import settings

def create_cpanel_email(email_address, email_password, quota=500):
    """
    Creates an email account in cPanel using the UAPI.
    
    Args:
        email_address (str): Full email address (e.g., 'user@mysafemail.xyz')
        email_password (str): Password for the email account
        quota (int, optional): Mailbox quota in MB. Defaults to 500. 0 = unlimited.
        
    Returns:
        tuple: (bool success, str message)
    """
    cpanel_host = getattr(settings, 'CPANEL_HOST', None)
    cpanel_port = getattr(settings, 'CPANEL_PORT', 2083)
    cpanel_user = getattr(settings, 'CPANEL_USERNAME', None)
    cpanel_pass = getattr(settings, 'CPANEL_PASSWORD', None)
    
    if not all([cpanel_host, cpanel_user, cpanel_pass]):
        return False, "cPanel credentials are not fully configured."
        
    try:
        # Split email into user and domain
        if '@' not in email_address:
            return False, "Invalid email format."
            
        email_user, domain = email_address.split('@')
        
        # Build the UAPI URL
        # Format: https://cpanel.domain.com:2083/execute/Email/add_pop
        base_url = f"{cpanel_host.rstrip('/')}:{cpanel_port}/execute/Email/add_pop"
        
        # Prepare parameters
        params = {
            'email': email_user,
            'password': email_password,
            'quota': quota,
            'domain': domain,
            'send_welcome_email': 0
        }
        
        # Make the request to cPanel API
        response = requests.get(
            base_url, 
            params=params, 
            auth=(cpanel_user, cpanel_pass),
            verify=False # We disable SSL verification in case the cPanel cert is self-signed
        )
        
        if response.status_code != 200:
            return False, f"Failed to connect to cPanel API. Status: {response.status_code}"
            
        data = response.json()
        
        # Check UAPI response format
        if data.get('status') == 1:
            return True, "Email account created successfully."
        else:
            # Extract error message
            errors = data.get('errors', [])
            error_msg = errors[0] if errors else "Unknown error occurred while creating email."
            
            # Check if email already exists
            if "already exists" in error_msg.lower():
                return False, "This email address is already taken. Please try another one."
                
            return False, error_msg
            
    except Exception as e:
        return False, f"An unexpected error occurred: {str(e)}"
