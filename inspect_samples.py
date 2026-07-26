import sqlite3

def inspect_samples():
    conn = sqlite3.connect("test_ksp.db")
    cursor = conn.cursor()
    
    tables = ["users", "districts", "firs", "locations", "district_indicators", "crime_stats", "accused", "victims", "financial_transactions"]
    
    for table in tables:
        print(f"\n=== Table: {table} ===")
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Columns: {', '.join(columns)}")
        
        cursor.execute(f"SELECT * FROM {table} LIMIT 2")
        rows = cursor.fetchall()
        for row in rows:
            print(f"  Row: {row}")
            
    conn.close()

if __name__ == "__main__":
    inspect_samples()
