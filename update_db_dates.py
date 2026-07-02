import paramiko

def run_remote_script():
    host = '216.126.194.123'
    user = 'iwklog1'
    password = 'I1w2k3-Log1'
    
    python_script = """
from apps.dashboard.models import CheckInScheduleConfig, ActiveService
from django.utils import timezone
from datetime import timedelta

now = timezone.now()
next_week = (now + timedelta(days=7)).strftime('%m/%d/%Y')
next_year = (now + timedelta(days=365)).strftime('%B %-d, %Y')

print(f"Updating CheckInScheduleConfig renewal_date to {next_week}")
CheckInScheduleConfig.objects.update(renewal_date=next_week)

print(f"Updating ActiveService active_until to {next_year}")
ActiveService.objects.update(active_until=next_year)

print("Dates updated successfully in database.")
"""
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(host, username=user, password=password)
        
        # Write the script to a file on the server
        sftp = client.open_sftp()
        with sftp.file('/home/iwklog1/app/backend/update_dates.py', 'w') as f:
            f.write(python_script)
        sftp.close()
        
        # Run the script via docker compose exec
        cmd = "cd ~/app/backend && sudo docker compose exec -T backend python update_dates.py"
        print(f"Running command: {cmd}")
        stdin, stdout, stderr = client.exec_command(f"echo '{password}' | sudo -S {cmd}")
        
        print("Output:", stdout.read().decode())
        print("Error:", stderr.read().decode())
        
        # Clean up
        client.exec_command("rm /home/iwklog1/app/backend/update_dates.py")
        
    finally:
        client.close()

if __name__ == '__main__':
    run_remote_script()
