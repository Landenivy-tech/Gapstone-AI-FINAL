const express = require('express');
const Datastore = require('nedb');
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

// Database setup with NeDB
const usersDB = new Datastore({ filename: './users.db', autoload: true });
const userDataDB = new Datastore({ filename: './user_data.db', autoload: true });
const songsDB = new Datastore({ filename: './songs.db', autoload: true });

console.log('Connected to NeDB databases.');

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

    // Check if user already exists
    usersDB.findOne({ $or: [{ username: username }, { email: email }] }, (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Create new user
        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
            created_at: new Date(),
            last_login: null
        };

        usersDB.insert(newUser, (err, insertedUser) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: 'User registered successfully',
                userId: insertedUser._id,
                username: insertedUser.username,
                email: insertedUser.email
            });
        });
    });
});

// Login user
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = hashPassword(password);

    usersDB.findOne({ username: username, password: hashedPassword }, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Update last login
        usersDB.update({ _id: user._id }, { $set: { last_login: new Date() } }, {}, (err) => {
            if (err) {
                console.error('Error updating last login:', err);
            }
        });

        res.json({
            message: 'Login successful',
            userId: user._id,
            username: user.username,
            email: user.email
        });
    });
});

// Get all users
app.get('/api/users', (req, res) => {
    usersDB.find({}, (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Transform NeDB format to match expected format
        const transformedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            last_login: user.last_login
        }));
        res.json(transformedUsers);
    });
});

// Get specific user profile
app.get('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;

    usersDB.findOne({ _id: userId }, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Transform NeDB format to match expected format
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            last_login: user.last_login
        });
    });
});

// ========== USER DATA ROUTES ==========

// Save user data
app.post('/api/users/:userId/data', (req, res) => {
    const userId = req.params.userId;
    const { key, value } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value required' });
    }

    // Check if data already exists
    userDataDB.findOne({ user_id: userId, data_key: key }, (err, existingData) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const now = new Date();

        if (existingData) {
            // Update existing data
            userDataDB.update(
                { _id: existingData._id },
                { $set: { data_value: value, updated_at: now } },
                {},
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Data saved successfully', key: key, value: value });
                }
            );
        } else {
            // Insert new data
            const newData = {
                user_id: userId,
                data_key: key,
                data_value: value,
                created_at: now,
                updated_at: now
            };

            userDataDB.insert(newData, (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Data saved successfully', key: key, value: value });
            });
        }
    });
});

// Get user data by key
app.get('/api/users/:userId/data/:key', (req, res) => {
    const { userId, key } = req.params;

    userDataDB.findOne({ user_id: userId, data_key: key }, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Data not found' });
        }
        res.json({
            key: row.data_key,
            value: row.data_value,
            created_at: row.created_at,
            updated_at: row.updated_at
        });
    });
});

// Get all user data
app.get('/api/users/:userId/data', (req, res) => {
    const userId = req.params.userId;

    userDataDB.find({ user_id: userId }).sort({ updated_at: -1 }).exec((err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const data = rows.map(row => ({
            key: row.data_key,
            value: row.data_value,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
        res.json(data);
    });
});

// Delete user data
app.delete('/api/users/:userId/data/:key', (req, res) => {
    const { userId, key } = req.params;

    userDataDB.remove({ user_id: userId, data_key: key }, {}, (err, numRemoved) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Data deleted successfully', deletedRows: numRemoved });
    });
});

// ========== SONGS ROUTES ==========
app.get('/api/songs', (req, res) => {
    songsDB.find({}).sort({ listens: -1 }).exec((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const songs = rows.map(row => ({
            id: row._id,
            title: row.title,
            artist: row.artist,
            listens: row.listens,
            description: row.description || "",
            created_at: row.created_at
        }));
        res.json(songs);
    });
});

// Add multiple songs
app.post('/api/songs', (req, res) => {
    const songs = req.body.songs;
    if (!songs || !Array.isArray(songs)) {
        return res.status(400).json({ error: 'Songs array required' });
    }

    const MAX_LISTENS = 10000000;

    // Validate each song
    for (const song of songs) {
        if (!song.title || !song.artist || typeof song.listens !== 'number') {
            return res.status(400).json({ error: 'Invalid song data: title, artist, and listens required' });
        }
        if (song.listens > MAX_LISTENS) {
            return res.status(400).json({ error: `Listens cannot exceed ${MAX_LISTENS.toLocaleString()}` });
        }
    }

    const now = new Date();
    const songDocs = songs.map(song => ({
        title: song.title,
        artist: song.artist,
        listens: song.listens || 0,
        description: song.description || "",
        created_at: now
    }));

    songsDB.insert(songDocs, (err, newDocs) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `${newDocs.length} songs imported successfully` });
    });
});

// Clear all songs
app.delete('/api/songs', (req, res) => {
    songsDB.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'All songs cleared', deleted: numRemoved });
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    songsDB.find({}, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const totalSongs = rows.length;
        const totalListens = rows.reduce((sum, song) => sum + (song.listens || 0), 0);
        const avgListens = totalSongs === 0 ? 0 : Math.round(totalListens / totalSongs);

        res.json({
            totalSongs,
            totalListens,
            avgListens
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
    console.log('Shutting down server...');
    process.exit(0);
});