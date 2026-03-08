# Google Calendar Sync Health Check

**Goal:** Programmatically check all stored `google_tokens` to ensure they are valid. Flag disconnected or expired tokens so the user can be notified.

**Tools/Scripts to Use:**
- `execution/check_calendar_tokens.py`

**Expected Inputs:**
- None (The script autonomously reads `.env` or `.env.local` credentials).

**Outputs:**
- stdout logging indicating which businesses have healthy tokens and which are disconnected.

**Instructions:**
1. Ensure dependencies are installed (`pip install -r execution/requirements.txt`).
2. Execute `python execution/check_calendar_tokens.py`.
3. Review the console output for any warnings about expired tokens or missing refresh tokens.
4. If failures are found, inform the user which `business_slug` needs to re-authenticate their calendar.
