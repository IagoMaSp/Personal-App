import sqlite3
import sys

def check():
    try:
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM finances_transaction")
        tx_count = cursor.fetchone()[0]
        print(f"Transactions count: {tx_count}")
        
        cursor.execute("SELECT COUNT(*) FROM finances_recurrencelog")
        rl_count = cursor.fetchone()[0]
        print(f"RecurrenceLog count: {rl_count}")
        
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    check()
