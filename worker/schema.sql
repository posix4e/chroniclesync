-- ChronicleSync Database Schema

-- Main clients table
CREATE TABLE IF NOT EXISTS clients (
    client_id TEXT PRIMARY KEY,
    last_sync DATETIME,
    data_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_last_sync ON clients(last_sync);
CREATE INDEX IF NOT EXISTS idx_created_at ON clients(created_at);