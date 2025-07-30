-- PACT Production Database Schema
-- Complete schema for PACT recycling management system

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  store_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  latitude REAL,
  longitude REAL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  UNIQUE(member_id, store_number)
);

-- Material types table
CREATE TABLE IF NOT EXISTS material_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT UNIQUE NOT NULL,
  store_id INTEGER NOT NULL,
  material_type_id INTEGER,
  weight_oz REAL NOT NULL,
  delivery_date DATE,
  program_type TEXT DEFAULT 'recycling',
  consumer_email TEXT,
  consumer_phone TEXT,
  points_earned INTEGER DEFAULT 0,
  is_contaminated BOOLEAN DEFAULT 0,
  contamination_notes TEXT,
  end_of_life_outcome TEXT,
  processed_at TIMESTAMP,
  processed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (material_type_id) REFERENCES material_types(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- PACT-specific shipments table
CREATE TABLE IF NOT EXISTS pact_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  store_id INTEGER,
  tracking_number TEXT,
  inbound_tracking TEXT,
  packages_count INTEGER DEFAULT 0,
  total_weight_lbs REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  shipped_date DATE,
  received_date DATE,
  processed_date DATE,
  uploaded_to_g2 BOOLEAN DEFAULT 0,
  g2_upload_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Users table (non-Clerk version)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'operator', 'admin', 'super_admin')),
  member_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Warehouse sessions table
CREATE TABLE IF NOT EXISTS warehouse_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  packages_processed INTEGER DEFAULT 0,
  total_weight_lbs REAL DEFAULT 0,
  average_processing_time_seconds REAL,
  notes TEXT,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT 0,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_store_id ON packages(store_id);
CREATE INDEX IF NOT EXISTS idx_packages_barcode ON packages(barcode);
CREATE INDEX IF NOT EXISTS idx_packages_delivery_date ON packages(delivery_date);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON pact_shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_inbound ON pact_shipments(inbound_tracking);
CREATE INDEX IF NOT EXISTS idx_stores_member_id ON stores(member_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);