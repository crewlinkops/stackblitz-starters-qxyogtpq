import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')
if not os.getenv("SUPABASE_URL"):
    load_dotenv('.env.local')

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials (including SUPABASE_SERVICE_ROLE_KEY) not found in environment.")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def check_token(access_token):
    # Call Google's tokeninfo endpoint to verify if the token is valid
    url = f"https://oauth2.googleapis.com/tokeninfo?access_token={access_token}"
    response = requests.get(url)
    return response.status_code == 200

def main():
    print("Starting Google Calendar Token Health Check...")
    
    # We must use the service role key to read from the google_tokens table since RLS restricts standard access
    try:
        res = requests.get(f"{SUPABASE_URL}/rest/v1/google_tokens?select=business_slug,access_token,refresh_token", headers=HEADERS)
        res.raise_for_status()
        tokens = res.json()
        
        if not tokens:
            print("No Google Calendar connections found in the database.")
            return
            
        healthy = 0
        issues = 0
        
        for tk in tokens:
            slug = tk.get('business_slug')
            access = tk.get('access_token')
            refresh = tk.get('refresh_token')
            
            if not access:
                print(f"WARNING: Business '{slug}' has a token record but no access_token.")
                issues += 1
                continue
                
            print(f"Checking '{slug}'...")
            is_valid = check_token(access)
            
            if is_valid:
                healthy += 1
                print(f"  ✓ Access token is valid.")
            else:
                if refresh:
                    print(f"  ! Access token expired, but refresh token is available (Can auto-refresh).")
                    healthy += 1
                else:
                    print(f"  X WARNING: Access token expired and NO refresh token available. User must re-authenticate.")
                    issues += 1
                    
        print(f"\nHealth Check Complete. Healthy: {healthy}, Issues: {issues}")
    except Exception as e:
        print(f"Failed to check calendar tokens: {str(e)}")

if __name__ == "__main__":
    main()
