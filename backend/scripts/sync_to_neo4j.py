import psycopg2
from neo4j import GraphDatabase
import os

# Configuration
PG_CONFIG = {
    "dbname": "ksp_crime_db",
    "user": "ksp_user",
    "password": "ksp_password",
    "host": "localhost",
    "port": "5432"
}

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password123"

def sync_data():
    try:
        pg_conn = psycopg2.connect(**PG_CONFIG)
        pg_cur = pg_conn.cursor()

        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        with driver.session() as session:
            print("Cleaning Neo4j graph...")
            session.run("MATCH (n) DETACH DELETE n")

            # 1. Sync Locations
            print("Syncing locations...")
            pg_cur.execute("SELECT id, district, station FROM locations")
            for row in pg_cur.fetchall():
                session.run("CREATE (l:Location {id: $id, district: $district, station: $station})",
                           id=row[0], district=row[1], station=row[2])

            # 2. Sync Accused
            print("Syncing accused...")
            pg_cur.execute("SELECT id, name, age, gender, is_habitual FROM accused")
            for row in pg_cur.fetchall():
                session.run("CREATE (a:Accused {id: $id, name: $name, age: $age, gender: $gender, is_habitual: $is_habitual})",
                           id=row[0], name=row[1], age=row[2], gender=row[3], is_habitual=row[4])

            # 3. Sync Victims
            print("Syncing victims...")
            pg_cur.execute("SELECT id, name, age, gender FROM victims")
            for row in pg_cur.fetchall():
                session.run("CREATE (v:Victim {id: $id, name: $name, age: $age, gender: $gender})",
                           id=row[0], name=row[1], age=row[2], gender=row[3])

            # 4. Sync FIRs
            print("Syncing FIRs...")
            pg_cur.execute("SELECT id, fir_number, crime_type, location_id FROM firs")
            for row in pg_cur.fetchall():
                session.run("CREATE (f:FIR {id: $id, fir_number: $fir_number, crime_type: $crime_type})",
                           id=row[0], fir_number=row[1], crime_type=row[2])
                # Link FIR to Location
                session.run("MATCH (f:FIR {id: $fid}), (l:Location {id: $lid}) CREATE (f)-[:OCCURRED_AT]->(l)",
                           fid=row[0], lid=row[3])

            # 5. Sync FIR-Accused
            print("Syncing FIR-Accused links...")
            pg_cur.execute("SELECT fir_id, accused_id FROM fir_accused")
            for row in pg_cur.fetchall():
                session.run("MATCH (f:FIR {id: $fid}), (a:Accused {id: $aid}) CREATE (a)-[:ACCUSED_IN]->(f)",
                           fid=row[0], aid=row[1])

            # 6. Sync FIR-Victims
            print("Syncing FIR-Victims links...")
            pg_cur.execute("SELECT fir_id, victim_id FROM fir_victims")
            for row in pg_cur.fetchall():
                session.run("MATCH (f:FIR {id: $fid}), (v:Victim {id: $vid}) CREATE (v)-[:VICTIM_OF]->(f)",
                           fid=row[0], vid=row[1])

            # 7. Sync Financial Transactions
            print("Syncing transactions...")
            pg_cur.execute("SELECT id, accused_id, amount, is_flagged, account_number FROM financial_transactions")
            for row in pg_cur.fetchall():
                session.run("CREATE (t:Transaction {id: $id, amount: $amount, is_flagged: $is_flagged, account_number: $acc_num})",
                           id=row[0], amount=row[1], is_flagged=row[3], acc_num=row[4])
                # Link Transaction to Accused
                session.run("MATCH (a:Accused {id: $aid}), (t:Transaction {id: $tid}) CREATE (a)-[:PERFORMED]->(t)",
                           aid=row[1], tid=row[0])

        driver.close()
        pg_cur.close()
        pg_conn.close()
        print("Successfully synced Postgres to Neo4j!")

    except Exception as e:
        print(f"Error during sync: {e}")

if __name__ == "__main__":
    sync_data()
