-- KSP Crime Intelligence Platform - Synthetic Schema

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    station VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);

CREATE TABLE accused (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    prior_offenses INTEGER DEFAULT 0,
    mo_tags TEXT, -- Comma separated or JSON
    is_habitual BOOLEAN DEFAULT FALSE
);

CREATE TABLE victims (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),
    socio_economic_background TEXT
);

CREATE TABLE firs (
    id SERIAL PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    status VARCHAR(50),
    description TEXT
);

CREATE TABLE fir_accused (
    fir_id INTEGER REFERENCES firs(id),
    accused_id INTEGER REFERENCES accused(id),
    PRIMARY KEY (fir_id, accused_id)
);

CREATE TABLE fir_victims (
    fir_id INTEGER REFERENCES firs(id),
    victim_id INTEGER REFERENCES victims(id),
    PRIMARY KEY (fir_id, victim_id)
);

CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    accused_id INTEGER REFERENCES accused(id),
    amount DECIMAL(15,2),
    transaction_date DATE,
    is_flagged BOOLEAN DEFAULT FALSE,
    account_number VARCHAR(50)
);

CREATE TABLE district_indicators (
    district VARCHAR(100) PRIMARY KEY,
    urbanization_pct DECIMAL(5,2),
    migration_rate DECIMAL(5,2),
    literacy_rate DECIMAL(5,2),
    unemployment_index DECIMAL(5,2),
    population_density DECIMAL(10,2)
);

CREATE TABLE historical_crime_stats (
    id SERIAL PRIMARY KEY,
    district VARCHAR(100),
    crime_type VARCHAR(100),
    month INTEGER,
    year INTEGER,
    crime_count INTEGER,
    is_event_date BOOLEAN DEFAULT FALSE,
    event_name VARCHAR(255)
);

-- Index for performance
CREATE INDEX idx_firs_date ON firs(date);
CREATE INDEX idx_firs_type ON firs(crime_type);
CREATE INDEX idx_accused_habitual ON accused(is_habitual);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prev_hash VARCHAR(64),
    message_hash VARCHAR(64)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_secret VARCHAR(100),
    mfa_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    endpoint VARCHAR(255),
    action VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    chain_hash VARCHAR(64)
);

CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    fir_id INTEGER REFERENCES firs(id),
    file_path TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    signature TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id)
);

-- Immutable Storage Simulation (WORM)
CREATE OR REPLACE FUNCTION prevent_modification() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Modifications to audit logs and evidence are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_modification();

CREATE TRIGGER trg_evidence_immutable
BEFORE UPDATE OR DELETE ON evidence
FOR EACH ROW EXECUTE FUNCTION prevent_modification();
