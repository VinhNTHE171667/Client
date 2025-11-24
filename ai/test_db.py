from app.db.mysql_conn import get_mysql_engine

eng = get_mysql_engine()
print('URL:', eng.url)

with eng.connect() as conn:
    print('TABLES:', conn.execute('SHOW TABLES').fetchall())
    r = conn.execute('SELECT id,email FROM customer WHERE email=:e LIMIT 1', {'e':'minh2@gmail.com'}).fetchone()
    print('Lookup:', r)