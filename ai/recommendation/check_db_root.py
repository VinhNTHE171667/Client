import os
from dotenv import load_dotenv
load_dotenv('.env')
# Force credentials to root/root as requested
os.environ['MYSQL_USER'] = os.getenv('MYSQL_USER','root')
os.environ['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD') or os.getenv('MYSQL_PASS') or 'root'
print('ENV used:', dict(MYSQL_HOST=os.getenv('MYSQL_HOST'), MYSQL_PORT=os.getenv('MYSQL_PORT'), MYSQL_USER=os.getenv('MYSQL_USER'), MYSQL_DB=os.getenv('MYSQL_DB')))

from sqlalchemy import create_engine
from sqlalchemy.engine import URL

host=os.getenv('MYSQL_HOST','localhost')
port=int(os.getenv('MYSQL_PORT') or 3306)
user=os.getenv('MYSQL_USER','root')
password=os.getenv('MYSQL_PASSWORD')
db=os.getenv('MYSQL_DB','gen_spa')
print('Attempting connect ->', host, port, db, 'user=', user)
try:
    url = URL.create(drivername='mysql+mysqlconnector', username=user, password=password or '', host=host, port=port, database=db)
    eng = create_engine(url, pool_pre_ping=True)
    with eng.connect() as conn:
        r = conn.execute('SELECT COUNT(*) FROM invoice').fetchone()
        print('OK invoice_count:', r[0])
except Exception as e:
    print('DB CONNECT ERROR:', type(e).__name__, str(e))
