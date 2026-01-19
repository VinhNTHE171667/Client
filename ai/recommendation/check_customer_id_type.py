import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

load_dotenv('.env')

host=os.getenv('MYSQL_HOST','localhost')
port=int(os.getenv('MYSQL_PORT') or 3306)
user=os.getenv('MYSQL_USER','root')
password=os.getenv('MYSQL_PASSWORD') or os.getenv('MYSQL_PASS') or ''
db=os.getenv('MYSQL_DB','')

print(f"Connecting to {db} on {host}:{port} as {user}")

try:
    url = URL.create(drivername='mysql+mysqlconnector', username=user, password=password, host=host, port=port, database=db)
    eng = create_engine(url)
    with eng.connect() as conn:
        # Check customer table
        try:
            result = conn.execute(text("SELECT id FROM customer LIMIT 5")).fetchall()
            print("Customer IDs from 'customer' table:")
            for row in result:
                print(f"  {row[0]} (type: {type(row[0])})")
        except Exception as e:
            print(f"Error querying customer table: {e}")

        # Check invoice table
        try:
            result = conn.execute(text("SELECT customer_id FROM invoice LIMIT 5")).fetchall()
            print("Customer IDs from 'invoice' table:")
            for row in result:
                print(f"  {row[0]} (type: {type(row[0])})")
        except Exception as e:
            print(f"Error querying invoice table: {e}")

except Exception as e:
    print(f"DB Error: {e}")
