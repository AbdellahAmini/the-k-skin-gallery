import sqlite3
from sqlalchemy import create_engine, inspect

conn = sqlite3.connect("backend/gallery.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
sqlite_tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]
print("SQLite tables:", sqlite_tables)

url = "postgresql+psycopg://neondb_owner:npg_ioDQ4NgxL6ad@ep-floral-base-b8bdx8z7-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
engine = create_engine(url)
insp = inspect(engine)
pg_tables = insp.get_table_names()
print("Postgres tables:", pg_tables)
