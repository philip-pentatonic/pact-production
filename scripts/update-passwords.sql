-- Update password hashes for existing users
UPDATE users SET password_hash = 'lZw2Nm6ZplimjTGfDrvLtcF/h/XGJU5xwQ5HPJSMg2QLmwZarP+OVqFmSYUJqDBx' WHERE username = 'admin';
UPDATE users SET password_hash = '/96OL7th8tav78JHBBske6lO1RNemKKs0VySrsA66nIiqTDJA+3PB4OzEUvBgXvZ' WHERE username = 'operations';
UPDATE users SET password_hash = 'ZqqEGqB/BqjXdKEfy7Hs9gtPi3W+GW/sZAZKhkOx0itnSTpQAJRlabzUIvljjW2p' WHERE username = 'demo';