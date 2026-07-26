"""
Catalyst Serverless Function — Cron Job
Name: rescan_habitual_flags
Schedule: Every Monday at 03:00 IST
Purpose: Re-evaluates the is_habitual flag on all accused records.
         An accused is flagged habitual if they appear in 2+ FIRs.
"""

import os
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")

def handler(request):
    """
    Catalyst Serverless Entry Point.
    Resets is_habitual=FALSE for all accused, then re-flags those
    who appear in 2 or more distinct FIRs via the fir_accused junction table.
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Step 1: Reset all habitual flags
        cursor.execute("UPDATE accused SET is_habitual = FALSE")

        # Step 2: Find accused with 2+ FIR links
        cursor.execute("""
            SELECT accused_id, COUNT(DISTINCT fir_id) AS fir_count
            FROM fir_accused
            GROUP BY accused_id
            HAVING COUNT(DISTINCT fir_id) >= 2
        """)
        habitual_rows = cursor.fetchall()

        habitual_ids = [row[0] for row in habitual_rows]

        # Step 3: Set is_habitual = TRUE for those accused
        if habitual_ids:
            cursor.execute(
                "UPDATE accused SET is_habitual = TRUE WHERE id = ANY(%s)",
                (habitual_ids,)
            )

        conn.commit()

        print(f"[Cron] Habitual scan complete. {len(habitual_ids)} accused flagged as habitual.")
        return {
            "status": "success",
            "habitual_count": len(habitual_ids),
            "accused_ids": habitual_ids
        }

    except Exception as e:
        conn.rollback()
        print(f"[Cron] Error during habitual rescan: {e}")
        return {"status": "error", "detail": str(e)}
    finally:
        cursor.close()
        conn.close()
