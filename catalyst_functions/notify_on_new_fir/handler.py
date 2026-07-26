"""
Catalyst Serverless Function — Signal / Event Function
Name: notify_on_new_fir
Trigger: INSERT on firs table (Catalyst Signals)
Purpose: On every new FIR insert, checks if the district has a recent crime spike
         and writes an early warning to a warnings log.
"""

import os
import json
import psycopg2
from datetime import datetime, timedelta

DATABASE_URL = os.environ.get("DATABASE_URL")

def handler(request):
    """
    Catalyst Event Function Entry Point.
    Triggered automatically by Catalyst Signals whenever a new row is inserted into firs.
    'request' contains the event payload with the new FIR row data.
    """
    try:
        event_data = request.get("data", {})
        fir_id = event_data.get("id")
        district_id = event_data.get("location_id")
        crime_type = event_data.get("crime_type", "Unknown")
        fir_date = event_data.get("date", str(datetime.utcnow().date()))

        if not fir_id or not district_id:
            return {"status": "skipped", "reason": "Missing fir_id or district_id in event"}

        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Get district name
        cursor.execute("SELECT district FROM locations WHERE id = %s LIMIT 1", (district_id,))
        loc_row = cursor.fetchone()
        district_name = loc_row[0] if loc_row else "Unknown"

        # Count FIRs in this district over the last 7 days
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).date()
        cursor.execute("""
            SELECT COUNT(*) FROM firs f
            JOIN locations l ON f.location_id = l.id
            WHERE l.district = %s AND f.date >= %s
        """, (district_name, seven_days_ago))
        recent_count = cursor.fetchone()[0]

        # Simple spike threshold: >10 FIRs in 7 days = warning
        if recent_count > 10:
            print(f"[Signal] SPIKE detected in {district_name}: {recent_count} FIRs in last 7 days")
            # In production: push to Catalyst Push Notifications or Catalyst Mail
            # For now, log a structured warning
            warning = {
                "type": "SPIKE",
                "level": "High",
                "district": district_name,
                "crime_type": crime_type,
                "trigger_fir_id": fir_id,
                "fir_count_7d": recent_count,
                "detected_at": str(datetime.utcnow())
            }
            print(f"[Warning] {json.dumps(warning)}")

        # Check if accused is habitual
        cursor.execute("""
            SELECT a.id, a.name, a.is_habitual
            FROM accused a
            JOIN fir_accused fa ON a.id = fa.accused_id
            WHERE fa.fir_id = %s AND a.is_habitual = TRUE
        """, (fir_id,))
        habitual_accused = cursor.fetchall()

        if habitual_accused:
            names = [row[1] for row in habitual_accused]
            print(f"[Signal] Habitual offenders in FIR {fir_id}: {', '.join(names)}")

        cursor.close()
        conn.close()

        return {
            "status": "success",
            "fir_id": fir_id,
            "district": district_name,
            "recent_7d_count": recent_count,
            "habitual_accused": len(habitual_accused) if habitual_accused else 0
        }

    except Exception as e:
        print(f"[Signal] Error processing FIR insert event: {e}")
        return {"status": "error", "detail": str(e)}
