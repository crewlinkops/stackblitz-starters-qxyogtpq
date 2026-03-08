# Database Integrity & Backup

**Goal:** Authenticate with Supabase, audit structured data (Bookings, Technicians, Services) for orphaned relational records, and export a clean CSV backup.

**Tools/Scripts to Use:**
- `execution/db_audit.py`

**Expected Inputs:**
- None (The script autonomously reads `.env` or `.env.local` credentials).

**Outputs:**
- stdout logging of orphaned records or integrity issues.
- `bookings_backup_*.csv`, `technicians_backup_*.csv`, etc. saved in the `.tmp/` directory.

**Instructions:**
1. Ensure dependencies are installed (`pip install -r execution/requirements.txt`).
2. Execute `python execution/db_audit.py`.
3. Review the console output for any orphans or data integrity warnings.
4. If the user requested a backup, inform them that the CSV files are safely stored in `.tmp/`.
