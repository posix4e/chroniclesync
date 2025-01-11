-- Example schema file
-- Replace with your actual schema

CREATE TABLE IF NOT EXISTS health_check (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);