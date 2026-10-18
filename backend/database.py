"""
database.py
Handles SQLite connection and table creation for the Expense Tracker app.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expenses.db")

VALID_CATEGORIES = [
    "Food", "Transportation", "Shopping", "Bills",
    "Entertainment", "Healthcare", "Education", "Other"
]

VALID_PAYMENT_METHODS = [
    "Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Other"
]


def get_connection():
    """Return a SQLite connection with rows accessible by column name."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enforce foreign keys / basic pragmas
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create tables if they don't already exist."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL CHECK (amount > 0),
            category TEXT NOT NULL,
            date TEXT NOT NULL,               -- format: YYYY-MM-DD
            payment_method TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL UNIQUE,       -- format: YYYY-MM
            amount REAL NOT NULL CHECK (amount >= 0),
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def seed_sample_data():
    """Insert sample expenses + a sample budget, but only if the DB is empty.
    This lets the dashboard/charts be tested immediately after first run."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) AS c FROM expenses")
    count = cur.fetchone()["c"]

    if count == 0:
        # Use the current month so sample data always shows up on the dashboard
        from datetime import date
        today = date.today()
        y, m = today.year, today.month

        def d(day):
            return f"{y:04d}-{m:02d}-{day:02d}"

        sample_expenses = [
            (850.0, "Food", d(2), "UPI", "Grocery shopping"),
            (1200.0, "Transportation", d(3), "Credit Card", "Fuel"),
            (3200.0, "Shopping", d(5), "Debit Card", "New shoes"),
            (450.0, "Food", d(6), "Cash", "Lunch with friends"),
            (2000.0, "Bills", d(7), "Bank Transfer", "Electricity bill"),
            (600.0, "Entertainment", d(8), "UPI", "Movie night"),
            (1500.0, "Healthcare", d(10), "Cash", "Pharmacy"),
            (5000.0, "Education", d(11), "Bank Transfer", "Online course"),
            (8500.0, "Shopping", d(12), "Credit Card", "Online purchase"),
            (300.0, "Food", d(13), "UPI", "Coffee and snacks"),
            (900.0, "Transportation", d(14), "Cash", "Cab rides"),
            (700.0, "Entertainment", d(15), "Debit Card", "Streaming subscription"),
        ]

        cur.executemany("""
            INSERT INTO expenses (amount, category, date, payment_method, description)
            VALUES (?, ?, ?, ?, ?)
        """, sample_expenses)

        current_month = f"{y:04d}-{m:02d}"
        cur.execute("""
            INSERT OR IGNORE INTO budgets (month, amount) VALUES (?, ?)
        """, (current_month, 30000.0))

        conn.commit()

    conn.close()
