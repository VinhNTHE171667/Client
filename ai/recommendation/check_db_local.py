import os
import sys
try:
    from dotenv import load_dotenv
    load_dotenv('.env')
except Exception:
    pass
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

host = os.getenv('MYSQL_HOST', 'localhost')
port = int(os.getenv('MYSQL_PORT') or 3306)
user = 'root'
password = 'root'
db = os.getenv('MYSQL_DB', 'gen_spa')

print(f"Using DB settings: host={host} port={port} db={db} user={user}")

try:
    url = URL.create(drivername='mysql+mysqlconnector', username=user, password=password, host=host, port=port, database=db)
    engine = create_engine(url, pool_pre_ping=True, connect_args={})
    with engine.connect() as conn:
        for tbl in ('invoice','appointment','service'):
            try:
                r = conn.execute(text(f"SELECT COUNT(*) AS c FROM `{tbl}`")).fetchone()
                print(f"{tbl} count: {r[0]}")
            except Exception as e:
                print(f"{tbl} query error: {type(e).__name__}: {e}")
    print('DB connect: OK')
except Exception as e:
    print('DB CONNECT ERROR:', type(e).__name__, str(e))
    sys.exit(2)
