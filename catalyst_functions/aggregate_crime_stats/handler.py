"""
Catalyst Serverless Function — Cron Job
Name: aggregate_crime_stats
Schedule: Daily at 02:00 IST
Purpose: Aggregates raw FIR records by district + crime_type + month + year
         and writes the rollup into historical_crime_stats.
"""

import os
import json
import psycopg2
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL")

def handler(request):
    """
    Catalyst Serverless Entry Point.
    Called daily by Catalyst Cron to aggregate FIR data.
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year

        # Aggregate FIRs by district + crime_type for current month/year
        cursor.execute("""
            SELECT
                l.district,
                f.crime_type,
                EXTRACT(MONTH FROM f.date)::INTEGER AS month,
                EXTRACT(YEAR FROM f.date)::INTEGER AS year,
                COUNT(*) AS crime_count
            FROM firs f
            JOIN locations l ON f.location_id = l.id
            WHERE EXTRACT(MONTH FROM f.date) = %s
              AND EXTRACT(YEAR FROM f.date) = %s
            GROUP BY l.district, f.crime_type, month, year
        """, (current_month, current_year))

        rows = cursor.fetchall()

        for row in rows:
            district, crime_type, month, year, count = row

            # Upsert into historical_crime_stats
            cursor.execute("""
                INSERT INTO historical_crime_stats
                    (district, crime_type, month, year, crime_count, is_event_date, event_name)
                VALUES (%s, %s, %s, %s, %s, FALSE, NULL)
                ON CONFLICT (district, crime_type, month, year)
                DO UPDATE SET crime_count = EXCLUDED.crime_count
            """, (district, crime_type, month, year, count))

        conn.commit()
        print(f"[Cron] Aggregated {len(rows)} stat rows for {current_month}/{current_year}")
        return {"status": "success", "rows_processed": len(rows)}

    except Exception as e:
        conn.rollback()
        print(f"[Cron] Error during aggregation: {e}")
        return {"status": "error", "detail": str(e)}
    finally:
        cursor.close()
        conn.close()
