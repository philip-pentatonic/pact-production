-- Initial PACT Database Schema Migration
-- Creates base tables for PACT production system

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
  store_name TEXT NOT NULL,
  store_code TEXT,
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
  UNIQUE(member_id, store_code)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
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

-- Program types table
CREATE TABLE IF NOT EXISTS program_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  member_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Material types table
CREATE TABLE IF NOT EXISTS material_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  is_recyclable BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main shipments table
CREATE TABLE IF NOT EXISTS pact_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id TEXT UNIQUE NOT NULL,
  pact_id TEXT,
  tracking_number TEXT,
  member_id INTEGER NOT NULL,
  store_id INTEGER,
  program_id INTEGER,
  shipping_date TIMESTAMP,
  processed_date TIMESTAMP,
  inbound_tracking TEXT,
  outbound_tracking TEXT,
  carrier TEXT,
  material_type TEXT,
  material_dashboard_label TEXT,
  weight_lbs REAL,
  recycled_pieces INTEGER,
  donated_pieces INTEGER,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  full_address TEXT,
  package_key TEXT,
  is_primary_record BOOLEAN DEFAULT 0,
  package_total_weight REAL,
  package_material_count INTEGER,
  is_contamination BOOLEAN DEFAULT 0,
  contamination_type TEXT,
  package_contamination_rate REAL,
  has_missing_shipping_date BOOLEAN DEFAULT 0,
  needs_unique_id_generation BOOLEAN DEFAULT 0,
  year INTEGER,
  box_type TEXT,
  status TEXT DEFAULT 'pending',
  import_batch INTEGER,
  original_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (program_id) REFERENCES program_types(id)
);

-- G2 uploads tracking table
CREATE TABLE IF NOT EXISTS g2_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_date TIMESTAMP NOT NULL,
  file_name TEXT,
  file_type TEXT,
  records_count INTEGER,
  records_processed INTEGER,
  errors_count INTEGER,
  status TEXT DEFAULT 'pending',
  error_details TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Material mapping table
CREATE TABLE IF NOT EXISTS pact_material_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_category TEXT NOT NULL,
  new_category TEXT,
  dashboard_label TEXT NOT NULL,
  description TEXT,
  is_recyclable INTEGER DEFAULT 1,
  is_contamination INTEGER DEFAULT 0,
  contamination_type TEXT,
  disposal_method TEXT,
  notes TEXT,
  effective_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  member_id INTEGER,
  store_id INTEGER,
  packages_count INTEGER DEFAULT 0,
  total_weight_lbs REAL DEFAULT 0,
  recyclable_weight_lbs REAL DEFAULT 0,
  contamination_weight_lbs REAL DEFAULT 0,
  contamination_rate REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  UNIQUE(date, member_id, store_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pact_shipments_member ON pact_shipments(member_id);
CREATE INDEX IF NOT EXISTS idx_pact_shipments_date ON pact_shipments(shipping_date);
CREATE INDEX IF NOT EXISTS idx_pact_shipments_package_key ON pact_shipments(package_key);
CREATE INDEX IF NOT EXISTS idx_pact_shipments_material ON pact_shipments(material_type);
CREATE INDEX IF NOT EXISTS idx_pact_shipments_contamination ON pact_shipments(is_contamination);
CREATE INDEX IF NOT EXISTS idx_pact_shipments_year ON pact_shipments(year);
CREATE INDEX IF NOT EXISTS idx_stores_member ON stores(member_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX IF NOT EXISTS idx_material_mapping_current ON pact_material_mapping(current_category);