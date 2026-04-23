-- ============================================
-- User Database Schema
-- SQLite Database for Music Leaderboard App
-- Created: April 23, 2026
-- ============================================

-- Drop existing tables if they exist (optional, comment out for safety)
-- DROP TABLE IF EXISTS user_data;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS songs;

-- ============================================
-- USERS TABLE
-- Stores user account information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT email_format CHECK (email LIKE '%@%.%')
);

-- Create index for faster username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- USER_DATA TABLE
-- Stores custom key-value data per user
-- ============================================
CREATE TABLE IF NOT EXISTS user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_key TEXT NOT NULL,
    data_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, data_key),
    
    CONSTRAINT key_not_empty CHECK (LENGTH(data_key) > 0)
);

-- Create indexes for faster data lookups
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_key ON user_data(data_key);
CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);

-- ============================================
-- SONGS TABLE
-- Stores song information (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    listens INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT title_not_empty CHECK (LENGTH(title) > 0),
    CONSTRAINT artist_not_empty CHECK (LENGTH(artist) > 0),
    CONSTRAINT listens_positive CHECK (listens >= 0)
);

-- Create indexes for faster song lookups
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_listens ON songs(listens DESC);

-- ============================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================

-- Sample Users
INSERT OR IGNORE INTO users (id, username, email, password, created_at, last_login)
VALUES 
    (1, 'demo_user', 'demo@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', datetime('now'), datetime('now')),
    (2, 'john_doe', 'john@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', datetime('now'), NULL),
    (3, 'jane_smith', 'jane@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', datetime('now'), NULL);

-- Sample User Data
INSERT OR IGNORE INTO user_data (user_id, data_key, data_value, created_at, updated_at)
VALUES 
    (1, 'favorite_song', 'Blinding Lights', datetime('now'), datetime('now')),
    (1, 'high_score', '9500', datetime('now'), datetime('now')),
    (1, 'theme', 'dark', datetime('now'), datetime('now')),
    (2, 'favorite_song', 'Shape of You', datetime('now'), datetime('now')),
    (2, 'high_score', '7200', datetime('now'), datetime('now')),
    (3, 'favorite_song', 'Levitating', datetime('now'), datetime('now')),
    (3, 'high_score', '8900', datetime('now'), datetime('now'));

-- Sample Songs
INSERT OR IGNORE INTO songs (id, title, artist, listens, created_at)
VALUES 
    (1, 'Blinding Lights', 'The Weeknd', 3000000, datetime('now')),
    (2, 'Shape of You', 'Ed Sheeran', 2500000, datetime('now')),
    (3, 'Levitating', 'Dua Lipa', 2200000, datetime('now')),
    (4, 'Someone You Loved', 'Lewis Capaldi', 1800000, datetime('now')),
    (5, 'Heat Waves', 'Glass Animals', 1600000, datetime('now'));

-- ============================================
-- VIEWS (Optional - Useful for common queries)
-- ============================================

-- View: User Summary with Data Count
CREATE VIEW IF NOT EXISTS vw_user_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    u.last_login,
    COUNT(ud.id) as data_count
FROM users u
LEFT JOIN user_data ud ON u.id = ud.user_id
GROUP BY u.id;

-- View: User Data as JSON-like format
CREATE VIEW IF NOT EXISTS vw_user_data_summary AS
SELECT 
    u.id as user_id,
    u.username,
    GROUP_CONCAT(ud.data_key || ':' || ud.data_value, ', ') as all_data
FROM users u
LEFT JOIN user_data ud ON u.id = ud.user_id
GROUP BY u.id;

-- View: Top Songs by Listens
CREATE VIEW IF NOT EXISTS vw_top_songs AS
SELECT 
    id,
    title,
    artist,
    listens,
    RANK() OVER (ORDER BY listens DESC) as rank
FROM songs;

-- ============================================
-- TRIGGERS (Optional - Auto-update timestamps)
-- ============================================

-- Auto-update user_data.updated_at when modified
CREATE TRIGGER IF NOT EXISTS tr_user_data_update
AFTER UPDATE ON user_data
FOR EACH ROW
BEGIN
    UPDATE user_data 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Update user.last_login when they login
CREATE TRIGGER IF NOT EXISTS tr_user_last_login
AFTER UPDATE OF last_login ON users
FOR EACH ROW
BEGIN
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ============================================
-- USEFUL QUERIES (Documentation)
-- ============================================

-- Get user profile with all data
-- SELECT 
--     u.id,
--     u.username,
--     u.email,
--     u.created_at,
--     u.last_login,
--     ud.data_key,
--     ud.data_value
-- FROM users u
-- LEFT JOIN user_data ud ON u.id = ud.user_id
-- WHERE u.username = 'demo_user'
-- ORDER BY ud.updated_at DESC;

-- Get all songs ordered by popularity
-- SELECT * FROM vw_top_songs ORDER BY rank LIMIT 10;

-- Get user's high score
-- SELECT data_value as high_score 
-- FROM user_data 
-- WHERE user_id = 1 AND data_key = 'high_score';

-- Find users with specific preference
-- SELECT u.username, ud.data_value 
-- FROM users u 
-- JOIN user_data ud ON u.id = ud.user_id 
-- WHERE ud.data_key = 'theme' AND ud.data_value = 'dark';

-- Get user activity summary
-- SELECT 
--     u.username,
--     COUNT(ud.id) as data_items,
--     MAX(ud.updated_at) as last_activity
-- FROM users u
-- LEFT JOIN user_data ud ON u.id = ud.user_id
-- GROUP BY u.id
-- ORDER BY last_activity DESC;

-- ============================================
-- SCHEMA INFORMATION
-- ============================================

-- Tables:
-- 1. users - User accounts and authentication
-- 2. user_data - Flexible key-value storage per user
-- 3. songs - Song information with listen counts

-- Views:
-- 1. vw_user_summary - User account summary with data counts
-- 2. vw_user_data_summary - User's all data concatenated
-- 3. vw_top_songs - Songs ranked by popularity

-- Key Features:
-- - User isolation (each user can only see their own data)
-- - Cascading deletes (deleting user removes their data)
-- - Constraints for data validation
-- - Indexes for performance optimization
-- - Triggers for automatic timestamp updates
-- - Foreign key relationships

-- ============================================
-- END OF DATABASE SCHEMA
-- ============================================
