"""
SHIELD prototype — database layer.
Plain sqlite3 (no ORM) — kept simple on purpose so the whole team can read
and modify it without learning SQLAlchemy under time pressure.
"""
import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "shield.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    service_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('PERSONNEL','WELFARE_OFFICER','COMMANDER')),
    unit_id TEXT NOT NULL,
    sub_unit_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS duty_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    duty_date TEXT NOT NULL,
    duty_hours REAL NOT NULL,
    rest_gap_hours REAL NOT NULL,
    consecutive_days INTEGER NOT NULL,
    workload_intensity REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    checkin_date TEXT NOT NULL,
    energy INTEGER NOT NULL,
    sleep_quality INTEGER NOT NULL,
    mental_fatigue INTEGER NOT NULL,
    readiness INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    checkin_id TEXT NOT NULL REFERENCES checkins(id),
    assessment_date TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    risk_score REAL NOT NULL,
    welfare_review_flag INTEGER NOT NULL DEFAULT 0,
    divergence_reason TEXT,
    top_factors_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS welfare_cases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    officer_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'OPEN',
    action_type TEXT,
    notes TEXT,
    follow_up_date TEXT,
    created_at TEXT NOT NULL
);
"""


def init_db(reset=False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def row_to_dict(row):
    return dict(row) if row else None
