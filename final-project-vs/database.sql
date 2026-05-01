-- ============================================
-- User Database Schema
-- MySQL Database for Music Leaderboard App
-- Created: April 24, 2026
--
-- IMPORTANT NOTES:
-- - This is MySQL syntax (not SQLite)
-- - Use with MySQL/MariaDB databases
-- - Foreign key constraints require proper table order
-- - AUTO_INCREMENT works in MySQL
--
-- To use this file:
-- mysql -u username -p database_name < database.sql
-- ============================================

-- Drop existing tables if they exist (optional, comment out for safety)
DROP TABLE IF EXISTS user_data;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS songs;

-- ============================================
-- USERS TABLE
-- Stores user account information
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
) ENGINE=InnoDB;

-- Create index for faster username lookups
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- ============================================
-- USER_DATA TABLE
-- Stores custom key-value data per user
-- ============================================
CREATE TABLE user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data_key VARCHAR(100) NOT NULL,
    data_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_key (user_id, data_key)
) ENGINE=InnoDB;

-- Create indexes for faster data lookups
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_key ON user_data(data_key);
CREATE INDEX idx_user_data_updated ON user_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_data_key ON user_data(data_key);
CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);

-- ============================================
-- SONGS TABLE
-- Stores song information (existing)
-- ============================================
CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    listens INT NOT NULL DEFAULT 0,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_song_title_artist (title, artist)
) ENGINE=InnoDB;

-- Create indexes for faster song lookups
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_listens ON songs(listens DESC);

-- ============================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================

-- Sample Users
INSERT INTO users (id, username, email, password, created_at, last_login)
VALUES
    (1, 'demo_user', 'demo@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', NOW(), NOW()),
    (2, 'john_doe', 'john@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', NOW(), NULL),
    (3, 'jane_smith', 'jane@example.com', '5e884898da28047151d0e56f8dc62927945b2bea4540801d1da735ee8cb963d9', NOW(), NULL);

-- Sample User Data
INSERT INTO user_data (user_id, data_key, data_value, created_at, updated_at)
VALUES
    (1, 'favorite_song', 'Blinding Lights', NOW(), NOW()),
    (1, 'high_score', '9500', NOW(), NOW()),
    (1, 'theme', 'dark', NOW(), NOW()),
    (2, 'favorite_song', 'Shape of You', NOW(), NOW()),
    (2, 'high_score', '7200', NOW(), NOW()),
    (3, 'favorite_song', 'Levitating', NOW(), NOW()),
    (3, 'high_score', '8900', NOW(), NOW());

-- Sample Songs
INSERT INTO songs (id, title, artist, listens, created_at)
VALUES
    (1, 'Blinding Lights', 'The Weeknd', 3000000, NOW()),
    (2, 'Shape of You', 'Ed Sheeran', 2500000, NOW()),
    (3, 'Levitating', 'Dua Lipa', 2200000, NOW()),
    (4, 'Someone You Loved', 'Lewis Capaldi', 1800000, NOW()),
    (5, 'Heat Waves', 'Glass Animals', 1600000, NOW());

-- ============================================
-- VIEWS (Optional - Useful for common queries)
-- ============================================

-- View: User Summary with Data Count
CREATE VIEW vw_user_summary AS
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
CREATE VIEW vw_user_data_summary AS
SELECT
    u.id as user_id,
    u.username,
    GROUP_CONCAT(CONCAT(ud.data_key, ':', ud.data_value) SEPARATOR ', ') as all_data
FROM users u
LEFT JOIN user_data ud ON u.id = ud.user_id
GROUP BY u.id;

-- View: Top Songs by Listens
CREATE VIEW vw_top_songs AS
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
DELIMITER //
CREATE TRIGGER tr_user_data_update
    BEFORE UPDATE ON user_data
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
//
DELIMITER ;

-- Update user.last_login when they login (this would be called from application)
-- Note: MySQL triggers can't automatically detect "login events"
-- This should be done in your application code when users authenticate

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
-- HOW TO USE THIS FILE
-- ============================================
--
-- Method 1: Command Line
-- mysql -u username -p database_name < database.sql
--
-- Method 2: phpMyAdmin
-- 1. Open phpMyAdmin
-- 2. Select your database
-- 3. Go to "Import" tab
-- 4. Upload this database.sql file
--
-- Method 3: MySQL Workbench
-- 1. Open MySQL Workbench
-- 2. Connect to your database
-- 3. Open this file and execute it
--
-- Method 4: Copy & Paste
-- Copy the SQL statements and paste into MySQL command line or GUI tool
--
-- ============================================
-- MYSQL SPECIFIC NOTES
-- ============================================
--
-- 1. Uses InnoDB engine for foreign key support
-- 2. AUTO_INCREMENT works correctly
-- 3. TIMESTAMP with ON UPDATE CURRENT_TIMESTAMP for auto-updates
-- 4. Foreign keys work with ON DELETE CASCADE
-- 5. VARCHAR instead of TEXT for better performance
--
-- ============================================
-- SCHEMA INFORMATION
-- ============================================
--
-- Tables:
-- 1. users - User accounts and authentication
-- 2. user_data - Flexible key-value storage per user
-- 3. songs - Song information with listen counts
--
-- Key Features:
-- - User isolation (each user can only see their own data)
-- - Cascading deletes (deleting user removes their data)
-- - InnoDB engine for transaction support and foreign keys
-- - AUTO_INCREMENT for primary keys
-- - TIMESTAMP with auto-update for tracking changes
-- - Proper indexing for performance
--
-- Data Types:
-- - INT for IDs and counts
-- - VARCHAR for limited text fields
-- - TEXT for unlimited text content
-- - TIMESTAMP for date/time tracking
--
-- ============================================
-- END OF DATABASE SCHEMA
-- ============================================
