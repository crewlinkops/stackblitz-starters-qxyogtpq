# Automated Demo Data Generation

**Goal:** Quickly seed realistic dummy bookings, technicians, and services into a specific `business_slug` for testing or onboarding demos.

**Tools/Scripts to Use:**
- `execution/seed_mock_data.py`

**Expected Inputs:**
- `--slug <business_slug>` (required): The identifier of the business to pump data into. 
- `--clean` (optional): Use this flag to wipe existing data for that slug before seeding.

**Outputs:**
- stdout success message indicating the number of records created.

**Instructions:**
1. Ensure dependencies are installed (`pip install -r execution/requirements.txt`).
2. Execute `python execution/seed_mock_data.py --slug your_target_slug` (e.g. `--slug acme-plumbing`).
3. Verify the records appear in the live application `/admin` dashboard.
