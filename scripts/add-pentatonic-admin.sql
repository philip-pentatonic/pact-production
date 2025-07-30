-- Add pentatonic admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin-pentatonic', 'admin@pentatonic.com', 'lZw2Nm6ZplimjTGfDrvLtcF/h/XGJU5xwQ5HPJSMg2QLmwZarP+OVqFmSYUJqDBx', 'Pentatonic', 'Admin', 'super_admin', 1);