-- Add password field to users table for local authentication
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Drop clerk_id requirement
CREATE TABLE users_new (
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

-- Copy existing data (where possible)
INSERT INTO users_new (email, first_name, last_name, role, member_id, is_active, last_login, created_at, updated_at, username, password_hash)
SELECT email, first_name, last_name, role, member_id, is_active, last_login, created_at, updated_at, 
       LOWER(REPLACE(email, '@', '_')), -- Generate username from email
       '$2a$10$dummyhash' -- Temporary hash, users will need to reset
FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Create index on username
CREATE INDEX idx_users_username ON users(username);