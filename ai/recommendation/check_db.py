import os
from dotenv import load_dotenv
load_dotenv('.env')
print('Loaded env:', dict(MYSQL_HOST=os.getenv('MYSQL_HOST'), MYSQL_PORT=os.getenv('MYSQL_PORT'), MYSQL_USER=os.getenv('MYSQL_USER'), MYSQL_PASS=os.getenv('MYSQL_PASSWORD') or os.getenv('MYSQL_PASS'), MYSQL_DB=os.getenv('MYSQL_DB')))

from sqlalchemy import create_engine
from sqlalchemy.engine import URL

host=os.getenv('MYSQL_HOST','localhost')
port=int(os.getenv('MYSQL_PORT') or 3306)
user=os.getenv('MYSQL_USER','root')
password=os.getenv('MYSQL_PASSWORD') or os.getenv('MYSQL_PASS') or ''
db=os.getenv('MYSQL_DB','')
print('Connecting to', host, port, db, 'as', user)
try:
    url = URL.create(drivername='mysql+mysqlconnector', username=user, password=password, host=host, port=port, database=db)
    eng = create_engine(url, pool_pre_ping=True)
    with eng.connect() as conn:
        r = conn.execute('SELECT COUNT(*) FROM invoice').fetchone()
        print('Invoice count:', r[0])
except Exception as e:
    print('DB CONNECT ERROR:', repr(e))
