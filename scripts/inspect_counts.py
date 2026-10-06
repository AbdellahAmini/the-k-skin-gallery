import sqlite3
from sqlalchemy import create_engine, text

sqlite_conn = sqlite3.connect("backend/gallery.db")
sqlite_c = sqlite_conn.cursor()

url = "postgresql+psycopg://neondb_owner:npg_ioDQ4NgxL6ad@ep-floral-base-b8bdx8z7-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
engine = create_engine(url)

tables = [
    'brands', 'categories', 'users', 'cities', 'promotions', 'site_settings',
    'product_subtypes', 'products', 'product_images', 'product_research',
    'product_metadata', 'skin_types', 'concerns', 'ingredients',
    'product_skin_types', 'product_concerns', 'product_ingredients',
    'routines', 'routine_steps', 'routine_step_products',
    'bundles', 'bundle_items', 'collections', 'collection_products',
    'content_sections', 'articles', 'orders', 'order_items', 'cart_items'
]

print(f"{'Table':<25} | {'SQLite Count':<12} | {'Neon Postgres Count':<12}")
print("-" * 55)

with engine.connect() as pg_conn:
    for t in tables:
        sqlite_count = sqlite_c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        pg_count = pg_conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        print(f"{t:<25} | {sqlite_count:<12} | {pg_count:<12}")
