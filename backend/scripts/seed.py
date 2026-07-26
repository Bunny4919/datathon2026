import random
from datetime import date, timedelta
import psycopg2
from faker import Faker

# Configuration
DB_CONFIG = {
    "dbname": "ksp_crime_db",
    "user": "ksp_user",
    "password": "ksp_password",
    "host": "localhost",
    "port": "5432"
}

fake = Faker('en_IN')

CRIME_TYPES = [
    "Theft", "Burglary", "Assault", "Fraud", "Cyber Crime",
    "Domestic Violence", "Drug Trafficking", "Robbery",
    "Extortion", "Public Nuisance"
]

DISTRICTS = [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Belagavi",
    "Mangaluru", "Davangere", "Ballari", "Tumakuru",
    "Shivamogga", "Kalaburagi"
]

STATUSES = ["Open", "Under Investigation", "Charge Sheet Filed", "Closed", "Cold Case"]
MO_TAGS = ["Night-time", "Forced Entry", "Digital Trace", "Coercion", "Sophisticated", "Impulsive", "Patterned"]
SOCIO_BACKGROUNDS = ["Lower Income", "Middle Class", "Upper Class", "Marginalized", "Industrial Labor"]

def seed_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to DB. Seeding synthetic data...")

        # 1. Locations
        location_ids = []
        for district in DISTRICTS:
            for i in range(2, 5):
                station = f"{district} Station {i}"
                lat = float(fake.latitude())
                long = float(fake.longitude())
                cur.execute(
                    "INSERT INTO locations (district, station, latitude, longitude) VALUES (%s, %s, %s, %s) RETURNING id",
                    (district, station, lat, long)
                )
                location_ids.append(cur.fetchone()[0])

        # 2. Accused
        accused_ids = []
        for _ in range(160):
            name = fake.name()
            age = random.randint(18, 65)
            gender = random.choice(["Male", "Female", "Other"])
            prior = random.randint(0, 10)
            is_habitual = prior > 3
            tags = ",".join(random.sample(MO_TAGS, k=random.randint(1, 3)))
            cur.execute(
                "INSERT INTO accused (name, age, gender, prior_offenses, mo_tags, is_habitual) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (name, age, gender, prior, tags, is_habitual)
            )
            accused_ids.append(cur.fetchone()[0])

        # 3. Victims
        victim_ids = []
        for _ in range(160):
            name = fake.name()
            age = random.randint(5, 80)
            gender = random.choice(["Male", "Female", "Other"])
            bg = random.choice(SOCIO_BACKGROUNDS)
            cur.execute(
                "INSERT INTO victims (name, age, gender, socio_economic_background) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, age, gender, bg)
            )
            victim_ids.append(cur.fetchone()[0])

        # 4. FIRs
        fir_ids = []
        start_date = date(2023, 1, 1)
        for i in range(220):
            fir_num = f"FIR/{fake.year()}/{1000 + i}"
            dt = start_date + timedelta(days=random.randint(0, 730))
            ctype = random.choice(CRIME_TYPES)
            loc_id = random.choice(location_ids)
            stat = random.choice(STATUSES)
            desc = fake.paragraph(as_dict=False)
            cur.execute(
                "INSERT INTO firs (fir_number, date, crime_type, location_id, status, description) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (fir_num, dt, ctype, loc_id, stat, desc)
            )
            fir_ids.append(cur.fetchone()[0])

        # 5. FIR-Accused & FIR-Victims mappings
        for fid in fir_ids:
            # Each FIR has 1-3 accused
            for _ in range(random.randint(1, 3)):
                aid = random.choice(accused_ids)
                cur.execute("INSERT INTO fir_accused (fir_id, accused_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (fid, aid))

            # Each FIR has 1-2 victims
            for _ in range(random.randint(1, 2)):
                vid = random.choice(victim_ids)
                cur.execute("INSERT INTO fir_victims (fir_id, victim_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (fid, vid))

        # 6. Financial Transactions
        for _ in range(300):
            aid = random.choice(accused_ids)
            amount = random.uniform(1000, 1000000)
            dt = date(2023, 1, 1) + timedelta(days=random.randint(0, 730))
            flagged = random.random() < 0.1
            acc_num = fake.iban()
            cur.execute(
                "INSERT INTO financial_transactions (accused_id, amount, transaction_date, is_flagged, account_number) VALUES (%s, %s, %s, %s, %s)",
                (aid, amount, dt, flagged, acc_num)
            )

        # 7. District Indicators
        for district in DISTRICTS:
            cur.execute(
                "INSERT INTO district_indicators (district, urbanization_pct, migration_rate, literacy_rate, unemployment_index, population_density) VALUES (%s, %s, %s, %s, %s, %s)",
                (district, random.uniform(20, 80), random.uniform(0.5, 5.0), random.uniform(60, 95), random.uniform(2, 15), random.uniform(100, 2000))
            )

        # 8. Historical Crime Stats (2+ years)
        for year in [2023, 2024]:
            for month in range(1, 13):
                for district in DISTRICTS:
                    for ctype in CRIME_TYPES:
                        count = random.randint(0, 50)
                        is_event = random.random() < 0.05
                        event = "Festival" if is_event else None
                        cur.execute(
                            "INSERT INTO historical_crime_stats (district, crime_type, month, year, crime_count, is_event_date, event_name) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                            (district, ctype, month, year, count, is_event, event)
                        )

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully seeded synthetic data!")

    except Exception as e:
        print(f"Error during seeding: {e}")

if __name__ == "__main__":
    seed_data()
