import os
import csv
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')
if not os.getenv("SUPABASE_URL"):
    load_dotenv('.env.local')

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in environment.")
    print("Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def fetch_table(table):
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*", headers=HEADERS)
    res.raise_for_status()
    return res.json()

def export_table_to_csv(table_name: str, data: list):
    if not data:
        print(f"No data to export for {table_name}.")
        return
    
    os.makedirs(".tmp", exist_ok=True)
    filename = f".tmp/{table_name}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    
    keys = data[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        dict_writer = csv.DictWriter(f, keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)
    
    print(f"Successfully backed up {len(data)} rows to {filename}")

def main():
    print("Starting Database Audit & Backup...")
    
    try:
        # Fetch Data natively via REST
        businesses = fetch_table("businesses")
        services = fetch_table("services")
        technicians = fetch_table("technicians")
        bookings = fetch_table("bookings")
        
        print(f"\n[Audit] Found {len(businesses)} businesses, {len(services)} services, {len(technicians)} technicians, {len(bookings)} bookings.")
        
        # Audit logic - enforce relational integrity
        business_slugs = {b['slug'] for b in businesses}
        service_ids = {s['id'] for s in services}
        technician_ids = {t['id'] for t in technicians}
        
        orphaned_services = [s for s in services if s.get('business_slug') and s['business_slug'] not in business_slugs]
        orphaned_technicians = [t for t in technicians if t.get('business_slug') and t['business_slug'] not in business_slugs]
        
        # Bookings audit
        orphaned_bookings_biz = [b for b in bookings if b.get('business_slug') and b['business_slug'] not in business_slugs]
        orphaned_bookings_svc = [b for b in bookings if b.get('service_id') and b['service_id'] not in service_ids]
        orphaned_bookings_tech = [b for b in bookings if b.get('assigned_technician_id') and b['assigned_technician_id'] not in technician_ids]

        warnings = 0
        if orphaned_services:
            print(f"WARNING: Found {len(orphaned_services)} orphaned services pointing to missing business slugs.")
            warnings += 1
        if orphaned_technicians:
            print(f"WARNING: Found {len(orphaned_technicians)} orphaned technicians pointing to missing business slugs.")
            warnings += 1
        if orphaned_bookings_biz:
            print(f"WARNING: Found {len(orphaned_bookings_biz)} bookings pointing to missing business slugs.")
            warnings += 1
        if orphaned_bookings_svc:
            print(f"WARNING: Found {len(orphaned_bookings_svc)} bookings pointing to missing services.")
            warnings += 1
        if orphaned_bookings_tech:
            print(f"WARNING: Found {len(orphaned_bookings_tech)} bookings pointing to missing assigned technicians.")
            warnings += 1
        
        if warnings == 0:
            print("Audit Passed: No orphaned relational records found.")

        # Export backups
        print("\nExporting CSV backups...")
        export_table_to_csv("businesses", businesses)
        export_table_to_csv("services", services)
        export_table_to_csv("technicians", technicians)
        export_table_to_csv("bookings", bookings)
        
        print("\nAudit and Backup complete.")
    except Exception as e:
         print(f"An error occurred during audit: {str(e)}")

if __name__ == "__main__":
    main()
