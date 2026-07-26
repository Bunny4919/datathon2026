from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Location, FIR, Accused, Victim, FinancialTransaction, DistrictIndicator, CrimeStat
from seed_db import seed_database
import os

TEST_DB_URL = "sqlite:///test_ksp_v2.db"

def verify_seed():
    print("Verifying seed logic with SQLite...")
    if os.path.exists("test_ksp_v2.db"):
        os.remove("test_ksp_v2.db")
    seed_database(TEST_DB_URL)

    engine = create_engine(TEST_DB_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    firs_count = session.query(FIR).count()
    accused_count = session.query(Accused).count()
    victims_count = session.query(Victim).count()
    districts_count = session.query(DistrictIndicator).count()
    stats_count = session.query(CrimeStat).count()

    print(f"FIRs: {firs_count}")
    print(f"Accused: {accused_count}")
    print(f"Victims: {victims_count}")
    print(f"Districts: {districts_count}")
    print(f"Crime Stats: {stats_count}")

    assert firs_count >= 200, "FIRs should be 200+"
    assert accused_count >= 150, "Accused should be 150+"
    assert victims_count >= 150, "Victims should be 150+"

    print("Verification successful!")

if __name__ == "__main__":
    verify_seed()
