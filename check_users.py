import sqlite3

def check_users():
    conn = sqlite3.connect("test_ksp.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, hashed_password FROM users")
    users = cursor.fetchall()
    print("Users in test_ksp.db:")
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Role: {user[2]}, Hash: {user[3]}")
    conn.close()

if __name__ == "__main__":
    check_users()
