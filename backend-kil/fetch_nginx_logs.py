import paramiko
import sys

host = "216.126.194.123"
user = "iwklog26"
password = "I1w2k3-Log"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect(host, username=user, password=password, timeout=10)
    stdin, stdout, stderr = client.exec_command("echo 'I1w2k3-Log' | sudo -S tail -n 50 /var/log/nginx/access.log; echo '--- ERROR ---'; echo 'I1w2k3-Log' | sudo -S tail -n 50 /var/log/nginx/error.log")
    print(stdout.read().decode())
    print(stderr.read().decode())
finally:
    client.close()
