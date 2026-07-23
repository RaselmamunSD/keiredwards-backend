import paramiko

def fetch_logs(ip, user, pw):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw, timeout=10)
    
    stdin, stdout, stderr = client.exec_command(f'echo \'{pw}\' | sudo -S docker logs --tail 50 fontaine_web')
    print("STDOUT:", stdout.read().decode())
    client.close()

fetch_logs('162.248.246.194', 'iwksign26', 'I1w2k3-Sign')
