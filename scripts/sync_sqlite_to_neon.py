#!/usr/bin/env python3
"""
sync_sqlite_to_neon.py

Robust synchronization pipeline from local SQLite (backend/gallery.db)
to remote Neon PostgreSQL database.
Commits after each table to ensure atomic progress and isolation.
"""

import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.types import Boolean

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SQLITE_PATH = PROJECT_ROOT / "backend" / "gallery.db"
NEON_URL = (
    "postgresql+psycopg://neondb_owner:npg_ioDQ4NgxL6ad@"
    "ep-floral-base-b8bdx8z7-pooler.c-14.us-east-1.aws.neon.tech/neondb?"
    "channel_binding=require&sslmode=require"
)

TABLES = [
    "users",
    "cities",
    "brands",
    "categories",
    "product_subtypes",
    "skin_types",
    "concerns",
    "ingredients",
    "promotions",
    "site_settings",
    "content_sections",
    "articles",
    "routines",
    "routine_steps",
    "bundles",
    "collections",
    "products",
    "product_images",
    "product_metadata",
    "product_research",
    "product_skin_types",
    "product_concerns",
    "product_ingredients",
    "routine_step_products",
    "bundle_items",
    "collection_products",
    "orders",
    "order_items",
    "order_status_history",
    "cart_items",
    "wishlist_items",
    "inventory_reservations",
    "notification_outbox",
    "stock_alerts",
    "bundle_cart_items",
    "order_bundle_items",
]

def log(msg: str):
    print(msg, flush=True)

def main():
    log(f"Opening SQLite database at: {SQLITE_PATH}")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    log("Connecting to Neon PostgreSQL...")
    engine = create_engine(NEON_URL, pool_pre_ping=True)
    inspector = inspect(engine)
    existing_pg_tables = set(inspector.get_table_names())

    # Step 1: Clear existing tables in reverse dependency order
    log("\n[1/3] Clearing tables in reverse dependency order...")
    with engine.begin() as conn:
        for table in reversed(TABLES):
            if table in existing_pg_tables:
                conn.execute(text(f'DELETE FROM "{table}";'))
                log(f"  Cleared {table}")

    # Step 2: Sync each table individually and commit immediately
    log("\n[2/3] Syncing tables from SQLite to Neon PostgreSQL...")
    for table in TABLES:
        if table not in existing_pg_tables:
            log(f"  [SKIP] Table {table} does not exist in Postgres")
            continue

        columns_info = inspector.get_columns(table)
        pg_col_types = {col["name"]: col["type"] for col in columns_info}
        pg_col_names = [col["name"] for col in columns_info]

        sqlite_cur.execute(f'SELECT * FROM "{table}"')
        rows = sqlite_cur.fetchall()
        if not rows:
            log(f"  [EMPTY] {table}: 0 rows")
            continue

        first_row = rows[0]
        col_names = [k for k in first_row.keys() if k in pg_col_names]

        records_to_insert = []
        for row in rows:
            record = {}
            for col in col_names:
                val = row[col]
                col_type = pg_col_types.get(col)
                if isinstance(col_type, Boolean) and val is not None:
                    val = bool(val)
                record[col] = val
            records_to_insert.append(record)

        col_list_str = ", ".join(f'"{c}"' for c in col_names)
        param_list_str = ", ".join(f":{c}" for c in col_names)
        insert_stmt = text(f'INSERT INTO "{table}" ({col_list_str}) VALUES ({param_list_str})')

        with engine.begin() as conn:
            conn.execute(insert_stmt, records_to_insert)
        log(f"  [SYNCED & COMMITTED] {table}: {len(records_to_insert)} rows")

    # Step 3: Reset serial sequences
    log("\n[3/3] Resetting PostgreSQL serial sequences...")
    for table in TABLES:
        try:
            with engine.begin() as conn:
                seq_name = conn.execute(text(f"SELECT pg_get_serial_sequence('{table}', 'id');")).scalar()
                if seq_name:
                    max_id = conn.execute(text(f'SELECT MAX(id) FROM "{table}";')).scalar() or 0
                    conn.execute(text(f"SELECT setval('{seq_name}', {max_id + 1}, false);"))
                    log(f"  Reset sequence for {table} to {max_id + 1}")
        except Exception as e:
            pass

    log("\n=== ALL DATA SUCCESSFULLY SYNCED TO NEON POSTGRESQL ===")

if __name__ == "__main__":
    main()
