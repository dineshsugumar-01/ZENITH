import requests

try:
    health = requests.get("http://localhost:8001/health")
    print(f"Backend Health: {health.status_code}")
except Exception as e:
    print(f"Backend not running: {e}")
