-- PACT Database Seed Data

-- Members
INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('Kiehl''s', 'KIEHLS', 'operations@kiehls.com', 1);
INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('Sephora', 'SEPHORA', 'sustainability@sephora.com', 1);
INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('Ulta Beauty', 'ULTA', 'recycling@ulta.com', 1);
INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('Macy''s', 'MACYS', 'green@macys.com', 1);
INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('Blue Mercury', 'BLUEMERCURY', 'eco@bluemercury.com', 1);

-- Program Types
INSERT OR IGNORE INTO program_types (code, name, description, is_active) VALUES ('RETAIL', 'Retail Take-Back', 'In-store customer recycling program', 1);
INSERT OR IGNORE INTO program_types (code, name, description, is_active) VALUES ('MAIL', 'Mail-Back', 'Customer mail-in recycling program', 1);
INSERT OR IGNORE INTO program_types (code, name, description, is_active) VALUES ('BULK', 'Bulk Inventory', 'Bulk inventory recycling from stores', 1);
INSERT OR IGNORE INTO program_types (code, name, description, is_active) VALUES ('WAREHOUSE', 'Warehouse Returns', 'Warehouse and DC returns recycling', 1);

-- Material Types
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('PET', 'PET Plastic', 'Plastic', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('HDPE', 'HDPE Plastic', 'Plastic', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('PP', 'PP Plastic', 'Plastic', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('GLASS', 'Glass', 'Glass', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('ALUMINUM', 'Aluminum', 'Metal', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('PAPER', 'Paper/Cardboard', 'Paper', 1);
INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('MIXED', 'Mixed Materials', 'Other', 1);

-- Users
-- Passwords: admin/admin123, operations/ops123, demo/demo123
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES ('admin', 'admin@pact.com', 'lZw2Nm6ZplimjTGfDrvLtcF/h/XGJU5xwQ5HPJSMg2QLmwZarP+OVqFmSYUJqDBx', 'PACT', 'Admin', 'super_admin', 1);
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES ('operations', 'operations@pact.com', '/96OL7th8tav78JHBBske6lO1RNemKKs0VySrsA66nIiqTDJA+3PB4OzEUvBgXvZ', 'Operations', 'Manager', 'admin', 1);
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES ('demo', 'demo@pact.com', 'ZqqEGqB/BqjXdKEfy7Hs9gtPi3W+GW/sZAZKhkOx0itnSTpQAJRlabzUIvljjW2p', 'Demo', 'User', 'viewer', 1);

-- Sample Stores

INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Times Square', 'NYC001', 'New York', 'NY', '10036', 1 FROM members WHERE code = 'KIEHLS';

INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Union Square', 'NYC002', 'New York', 'NY', '10003', 1 FROM members WHERE code = 'KIEHLS';

INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Beverly Hills', 'LA001', 'Beverly Hills', 'CA', '90210', 1 FROM members WHERE code = 'KIEHLS';
