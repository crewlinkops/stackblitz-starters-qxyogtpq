import os
import argparse
import random
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv('.env')
if not os.getenv("SUPABASE_URL"):
    load_dotenv('.env.local')

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase service role credentials not found in environment.")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
PREFER_RETURN = {**HEADERS, "Prefer": "return=representation"}

def get_table(table, params=""):
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    res.raise_for_status()
    return res.json()

def insert_table(table, json_data):
    res = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", json=json_data, headers=PREFER_RETURN)
    res.raise_for_status()
    return res.json()

def delete_table(table, params):
    res = requests.delete(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    res.raise_for_status()

def seed_data(slug: str, clean: bool):
    print(f"Seeding mock data for business: '{slug}'")
    
    try:
        # Check if business exists
        biz = get_table("businesses", f"select=id&slug=eq.{slug}")
        if not biz:
            print(f"Business '{slug}' not found. Creating it...")
            insert_table("businesses", {"name": f"{slug.capitalize()} Services", "slug": slug})
            
        if clean:
            print("Cleaning existing related data...")
            delete_table("bookings", f"business_slug=eq.{slug}")
            delete_table("time_slots", f"business_slug=eq.{slug}")
            delete_table("services", f"business_slug=eq.{slug}")
            delete_table("technicians", f"business_slug=eq.{slug}")
            
        print("Creating services...")
        services_to_add = [
            {"business_slug": slug, "name": "Diagnostic Session", "duration_min": 60, "description": "General diagnostic and troubleshooting."},
            {"business_slug": slug, "name": "Standard Repair", "duration_min": 120, "description": "Standard service and repair."}
        ]
        services = insert_table("services", services_to_add)
        
        print("Creating technicians...")
        techs_to_add = [
            {"business_slug": slug, "name": "Alice Expert", "email": "alice@example.com", "active": True},
            {"business_slug": slug, "name": "Bob Builder", "email": "bob@example.com", "active": True}
        ]
        technicians = insert_table("technicians", techs_to_add)
        
        print("Creating mock bookings and timeslots...")
        now = datetime.utcnow()
        urgency_options = ['normal', 'high', 'emergency', 'flexible']
        
        for i in range(-5, 5):
            days_offset = i
            start = now + timedelta(days=days_offset)
            start = start.replace(hour=random.randint(8, 16), minute=0, second=0, microsecond=0)
            end = start + timedelta(hours=2)
            
            tech = random.choice(technicians)
            svc = random.choice(services)
            
            if days_offset < 0:
                status = random.choice(['completed', 'completed', 'cancelled'])
            else:
                status = random.choice(['new', 'confirmed', 'assigned'])
                
            booking_data = {
                "business_slug": slug,
                "customer_name": f"Mock Customer {i+6}",
                "customer_email": f"customer{i+6}@mock.com",
                "customer_phone": "+15550001234",
                "service_id": svc['id'],
                "assigned_technician_id": tech['id'],
                "preferred_time": start.isoformat(),
                "status": status,
                "customer_address": f"{random.randint(100, 999)} Mockingbird Lane",
                "urgency": random.choice(urgency_options)
            }
            b_res = insert_table("bookings", booking_data)
            
            insert_table("time_slots", {
                "business_slug": slug,
                "technician_id": tech['id'],
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "status": "booked" if status != 'cancelled' else 'open',
                "booking_id": b_res[0]['id'] if status != 'cancelled' else None
            })
            
        print(f"Successfully seeded 10 detailed bookings for {slug}!")
    except Exception as e:
        print(f"An error occurred while seeding data: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="Seed mock data into Crewlink.")
    parser.add_argument("--slug", required=True, help="The business_slug to mock data for.")
    parser.add_argument("--clean", action="store_true", help="Delete existing resources for this slug before seeding.")
    
    args = parser.parse_args()
    seed_data(args.slug, args.clean)

if __name__ == "__main__":
    main()
