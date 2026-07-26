from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Location, FIR, Accused, Victim, FinancialTransaction, DistrictIndicator, CrimeStat
from faker import Faker
import random
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/ksp_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_database(db_url=None):
    url = db_url or os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/ksp_db")
    engine = create_engine(url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    ...


    try:
        if session.query(User).first():
            print("Database already seeded. Skipping.")
            return

        fake = Faker()
        print("Seeding synthetic data for KSP Platform...")

        # 1. Locations
        districts = ["Bangalore", "Mysuru", "Hubli", "Mangaluru", "Belagavi", "Shimoga", "Ballari", "Davanagere"]
        stations = ["Central", "East", "West", "North", "South", "Rural"]
        locations = []
        for d in districts:
            for s in stations:
                locations.append(Location(
                    district=d,
                    station=s,
                    latitude=random.uniform(12.0, 16.0),
                    longitude=random.uniform(74.0, 77.0)
                ))
        session.add_all(locations)
        session.commit()

        # 2. Users (Roles)
        roles = ["Investigator", "Analyst", "Supervisor", "Policymaker"]
        users = []
        for i in range(10):
            users.append(User(
                username=f"user_{i}",
                hashed_password="hashed_password_placeholder", # To be updated by auth logic
                role=random.choice(roles)
            ))
        session.add_all(users)
        session.commit()

        # 3. District Indicators
        indicators = []
        for d in districts:
            indicators.append(DistrictIndicator(
                district=d,
                urbanization_pct=random.uniform(30.0, 90.0),
                migration_rate=random.uniform(0.1, 5.0),
                literacy_rate=random.uniform(60.0, 98.0),
                unemployment_index=random.uniform(2.0, 15.0),
                pop_density=random.uniform(100, 20000)
            ))
        session.add_all(indicators)
        session.commit()

        # 4. FIRs (200+)
        crime_types = ["Theft", "Burglary", "Cybercrime", "Assault", "Fraud", "Homicide", "Narcotics"]
        firs = []
        for i in range(250):
            firs.append(FIR(
                date=datetime.utcnow() - timedelta(days=random.randint(0, 730)),
                crime_type=random.choice(crime_types),
                location_id=random.choice(locations).id,
                status=random.choice(["Open", "Closed", "Under Investigation"]),
                description=fake.paragraph()
            ))
        session.add_all(firs)
        session.commit()

        # 5. Accused (150+)
        accused_list = []
        mo_tags_pool = ["night_entry", "social_engineering", "forced_entry", "digital_phishing", "street_fight", "organized_gang"]
        for i in range(180):
            accused_list.append(Accused(
                name=fake.name(),
                age=random.randint(18, 60),
                gender=random.choice(["Male", "Female", "Other"]),
                prior_offenses=random.randint(0, 10),
                mo_tags=",".join(random.sample(mo_tags_pool, random.randint(1, 3))),
                habitual_flag=random.choice([True, False]),
                fir_id=random.choice(firs).id
            ))
        session.add_all(accused_list)
        session.commit()

        # 6. Victims (150+)
        victims = []
        for i in range(170):
            victims.append(Victim(
                age=random.randint(10, 80),
                gender=random.choice(["Male", "Female", "Other"]),
                socio_economic_bg=random.choice(["Low", "Middle", "High"]),
                fir_id=random.choice(firs).id
            ))
        session.add_all(victims)
        session.commit()

        # 7. Financial Transactions
        transactions = []
        for i in range(100):
            transactions.append(FinancialTransaction(
                accused_id=random.choice(accused_list).id,
                amount=random.uniform(1000, 1000000),
                date=datetime.utcnow() - timedelta(days=random.randint(0, 730)),
                flagged_status=random.choice([True, False]),
                account_number=fake.iban()
            ))
        session.add_all(transactions)
        session.commit()

        # 8. Crime Stats (2+ years historical)
        stats = []
        events = {
            (10, 2023): "Diwali",
            (3, 2023): "Holi",
            (10, 2024): "Diwali",
            (3, 2024): "Holi",
            (4, 2024): "Elections",
        }
        for d in districts:
            for ct in crime_types:
                for year in [2023, 2024]:
                    for month in range(1, 13):
                        is_event = (month, year) in events
                        event_name = events.get((month, year)) if is_event else None
                        count = random.randint(10, 50) if not is_event else random.randint(50, 150)
                        stats.append(CrimeStat(
                            district=d,
                            crime_type=ct,
                            month=month,
                            year=year,
                            count=count,
                            event_date=is_event,
                            event_name=event_name
                        ))
        session.add_all(stats)
        session.commit()

        print("Successfully seeded synthetic data for KSP Platform!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
