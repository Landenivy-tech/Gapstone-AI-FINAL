const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./songs.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTable();
    }
});

// Create songs table
function createTable() {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');
        }
    });

    // Create user_data table for storing user-specific data
    db.run(`CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data_key TEXT NOT NULL,
        data_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, data_key)
    )`, (err) => {
        if (err) {
            console.error('Error creating user_data table:', err.message);
        } else {
            console.log('User_data table ready.');
        }
    });

    // Create songs table
    db.run(`CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        listens INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Songs table ready.');
        }
    });
}

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// API Routes

// ========== USER AUTHENTICATION ROUTES ==========

// Register a new user
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password required' });
    }

    const hashedPassword = hashPassword(password);

    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                message: 'User registered successfully',
                userId: this.lastID,
                username: username,
                email: email
            });
        }
    );
});

// Login user
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = hashPassword(password);

    db.get('SELECT id, username, email FROM users WHERE username = ? AND password = ?',
        [username, hashedPassword],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!row) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);

            res.json({
                message: 'Login successful',
                userId: row.id,
                username: row.username,
                email: row.email
            });
        }
    );
});

// Get all users
app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, email, created_at, last_login FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get specific user profile
app.get('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;

    db.get('SELECT id, username, email, created_at, last_login FROM users WHERE id = ?', 
        [userId], 
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(row);
        }
    );
});

// ========== USER DATA ROUTES ==========

// Save user data
app.post('/api/users/:userId/data', (req, res) => {
    const userId = req.params.userId;
    const { key, value } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value required' });
    }

    db.run(`INSERT INTO user_data (user_id, data_key, data_value, updated_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, data_key) 
            DO UPDATE SET data_value = ?, updated_at = CURRENT_TIMESTAMP`,
        [userId, key, value, value],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Data saved successfully', key: key, value: value });
        }
    );
});

// Get user data by key
app.get('/api/users/:userId/data/:key', (req, res) => {
    const { userId, key } = req.params;

    db.get('SELECT * FROM user_data WHERE user_id = ? AND data_key = ?', 
        [userId, key], 
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: 'Data not found' });
            }
            res.json(row);
        }
    );
});

// Get all user data
app.get('/api/users/:userId/data', (req, res) => {
    const userId = req.params.userId;

    db.all('SELECT data_key, data_value, created_at, updated_at FROM user_data WHERE user_id = ? ORDER BY updated_at DESC',
        [userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Delete user data
app.delete('/api/users/:userId/data/:key', (req, res) => {
    const { userId, key } = req.params;

    db.run('DELETE FROM user_data WHERE user_id = ? AND data_key = ?',
        [userId, key],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Data deleted successfully', deletedRows: this.changes });
        }
    );
});

// ========== SONGS ROUTES ==========
app.get('/api/songs', (req, res) => {
    db.all('SELECT * FROM songs ORDER BY listens DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add multiple songs
app.post('/api/songs', (req, res) => {
    const songs = req.body.songs;
    if (!songs || !Array.isArray(songs)) {
        return res.status(400).json({ error: 'Songs array required' });
    }

    const stmt = db.prepare('INSERT INTO songs (title, artist, listens) VALUES (?, ?, ?)');

    let insertedCount = 0;
    songs.forEach(song => {
        stmt.run([song.title, song.artist, song.listens], function(err) {
            if (err) {
                console.error('Error inserting song:', err.message);
            } else {
                insertedCount++;
                if (insertedCount === songs.length) {
                    res.json({ message: `${insertedCount} songs imported successfully` });
                }
            }
        });
    });

    stmt.finalize();
});

// Clear all songs
app.delete('/api/songs', (req, res) => {
    db.run('DELETE FROM songs', [], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'All songs cleared', deleted: this.changes });
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    db.get('SELECT COUNT(*) as totalSongs, SUM(listens) as totalListens, AVG(listens) as avgListens FROM songs', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            totalSongs: row.totalSongs || 0,
            totalListens: row.totalListens || 0,
            avgListens: Math.round(row.avgListens || 0)
        });
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'leaderboard.html'));
});

app.get('/import', (req, res) => {
    res.sendFile(path.join(__dirname, 'import.html'));
});

app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'info.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});