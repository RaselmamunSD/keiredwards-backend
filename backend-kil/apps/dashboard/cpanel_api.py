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
        if '@' not in email_address:
            return False, "Invalid email format."
            
        email_user, domain = email_address.split('@')
        
        session = requests.Session()
        login_url = f"{cpanel_host.rstrip(':2083')}:{cpanel_port}/login/?login_only=1"
        login_data = {'user': cpanel_user, 'pass': cpanel_pass}
        
        # Login to get security token and cookies
        login_response = session.post(login_url, data=login_data, verify=False, timeout=10)
        login_response.raise_for_status()
        
        token = login_response.json().get('security_token')
        if not token:
            return False, "Failed to authenticate with cPanel. Invalid credentials."
            
        # Call UAPI to create email
        uapi_url = f"{cpanel_host.rstrip(':2083')}:{cpanel_port}{token}/execute/Email/add_pop"
        params = {
            'email': email_user,
            'password': email_password,
            'quota': quota,
            'domain': domain,
            'send_welcome_email': 0
        }
        
        uapi_response = session.get(uapi_url, params=params, verify=False, timeout=15)
        uapi_response.raise_for_status()
        data = uapi_response.json()
        
        if data.get('status') == 1:
            return True, "Email account created successfully."
        else:
            errors = data.get('errors', [])
            error_msg = errors[0] if errors else "Unknown error occurred while creating email."
            if "already exists" in error_msg.lower():
                return False, "This email address is already taken. Please try another one."
            return False, error_msg
            
    except Exception as e:
        return False, f"An unexpected error occurred: {str(e)}"
