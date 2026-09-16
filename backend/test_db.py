import psycopg2

db_url = "postgresql://postgres.eanuqinjawpkvwfojygx:cb8RGs3vmAfB01HH@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

print('Connecting to DB...')
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT version();')
    print('DB Connection Successful!')
    print('PostgreSQL Version:', cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('Failed to connect:', e)
