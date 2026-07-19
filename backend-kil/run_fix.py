import paramiko
import os

host = "216.126.194.123"
user = "iwklog26"
password = "I1w2k3-Log"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect(host, username=user, password=password, timeout=10)
    
    # Upload fix_users.py
    sftp = client.open_sftp()
    sftp.put(r"C:\Rasel\keiredwards\backend-kil\fix_users.py", "/home/iwklog26/fix_users.py")
    sftp.close()
    
    # Execute it using docker compose exec or just run it via docker exec on the web container
    stdin, stdout, stderr = client.exec_command("echo 'I1w2k3-Log' | sudo -S docker compose -f ~/app/backend/docker-compose.yml cp /home/iwklog26/fix_users.py web:/app/fix_users.py; echo 'I1w2k3-Log' | sudo -S docker compose -f ~/app/backend/docker-compose.yml exec web python /app/fix_users.py")
    
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
finally:
    client.close()
