import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_api():
    print("--- Starting Backend Verification ---")
    time.sleep(2) # Give server time to boot

    # 1. Test INVALID GST Company Registration
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "invalid_gst@acme.com",
            "password": "password123",
            "role": "company",
            "phone": "999999999",
            "companyName": "Invalid Acme",
            "gstNumber": "00INVALIDGST",
            "cinNumber": "CIN123",
            "directorName": "John Doe",
            "address": "Test Addr"
        })
        print("Invalid GST Test:")
        print("Status:", res.status_code)
        print("Response:", res.json())
        assert res.status_code == 400
        assert "GST Verification Failed" in res.json()['detail']
        print("[PASS] Invalid GST successfully rejected.")
    except Exception as e:
        print(f"[FAIL] {e}")

    # 2. Test Valid GST Company Registration
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "valid_gst@acme.com",
            "password": "password123",
            "role": "company",
            "phone": "888888888",
            "companyName": "Valid Acme Pvt Ltd",
            "gstNumber": "27VALIDGST",
            "cinNumber": "CIN456",
            "directorName": "Jane Doe",
            "address": "Valid Addr"
        })
        if res.status_code == 200:
            print(f"[PASS] Valid GST successfully registered.")
            company_id = res.json()['id']
        else:
            print("[FAIL] Valid GST registration failed:", res.json())
    except Exception as e:
        print(f"[FAIL] {e}")

    # 3. Test Vendor Registration
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "vendor@supply.com",
            "password": "password123",
            "role": "vendor",
            "phone": "777777777",
            "companyName": "Supply Co",
            "gstNumber": "19VENDOR",
            "contactPerson": "Tim",
            "category": "Metals",
            "address": "Vendor Addr",
            "bankAccountNumber": "12345",
            "bankIfsc": "SBIN00",
            "bankName": "SBI"
        })
        if res.status_code == 200:
            print(f"[PASS] Vendor successfully registered.")
        else:
            print("[FAIL] Vendor registration failed:", res.json())
    except Exception as e:
        print(f"[FAIL] {e}")

    # 4. Test Login
    try:
        res = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "valid_gst@acme.com",
            "password": "password123"
        })
        if res.status_code == 200:
            print(f"[PASS] Login successful. JWT Token received.")
            token = res.json()['access_token']
        else:
            print("[FAIL] Login failed:", res.json())
    except Exception as e:
        print(f"[FAIL] {e}")

if __name__ == "__main__":
    test_api()
