const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'final_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

async function ensureSongsSchema() {
    const connection = await pool.getConnection();
    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS songs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                listens INT NOT NULL DEFAULT 0,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_song_title_artist (title, artist)
            ) ENGINE=InnoDB;
        `);
        const [rows] = await connection.execute(
            `SELECT COUNT(*) AS count
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = 'songs'
               AND COLUMN_NAME = 'description'`,
            [dbConfig.database]
        );

        if (rows[0].count === 0) {
            await connection.execute('ALTER TABLE songs ADD COLUMN description TEXT NULL');
        }
    } finally {
        connection.release();
    }
}

async function queryDatabase(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

app.get('/api/songs', async (req, res) => {
    try {
        const songs = await queryDatabase(
            'SELECT id, title, artist, listens, description FROM songs ORDER BY listens DESC'
        );
        res.json(songs);
    } catch (error) {
        console.error('Failed to fetch songs:', error);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

app.post('/api/songs', async (req, res) => {
    const songs = Array.isArray(req.body.songs) ? req.body.songs : [];

    if (!songs.length) {
        return res.status(400).json({ error: 'No songs provided' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const song of songs) {
            const title = (song.title || '').trim();
            const artist = (song.artist || '').trim();
            const listens = Number(song.listens) || 0;
            const description = song.description || null;

            if (!title || !artist) {
                continue;
            }

            await connection.execute(
                `INSERT INTO songs (title, artist, listens, description)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                     listens = VALUES(listens),
                     description = VALUES(description)`,
                [title, artist, listens, description]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Songs saved successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Failed to save songs:', error);
        res.status(500).json({ error: 'Failed to save songs' });
    } finally {
        connection.release();
    }
});

app.delete('/api/songs', async (req, res) => {
    try {
        const result = await queryDatabase('DELETE FROM songs');
        res.json({ success: true, message: 'All songs deleted', rowsAffected: result.affectedRows || 0 });
    } catch (error) {
        console.error('Failed to clear songs:', error);
        res.status(500).json({ error: 'Failed to clear songs' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [stats] = await queryDatabase(
            `SELECT
                COUNT(*) AS totalSongs,
                COALESCE(SUM(listens), 0) AS totalListens,
                COALESCE(ROUND(AVG(listens)), 0) AS avgListens
             FROM songs`
        );
        res.json(stats || { totalSongs: 0, totalListens: 0, avgListens: 0 });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.put('/api/songs/:songId', async (req, res) => {
    const songId = parseInt(req.params.songId, 10);
    if (Number.isNaN(songId)) {
        return res.status(400).json({ error: 'Invalid song ID' });
    }

    const title = req.body.title ? req.body.title.trim() : null;
    const artist = req.body.artist ? req.body.artist.trim() : null;
    const listens = req.body.listens !== undefined ? Number(req.body.listens) : null;
    const description = req.body.description !== undefined ? req.body.description : null;

    const updates = [];
    const values = [];

    if (title !== null && title !== '') {
        updates.push('title = ?');
        values.push(title);
    }
    if (artist !== null && artist !== '') {
        updates.push('artist = ?');
        values.push(artist);
    }
    if (listens !== null && !Number.isNaN(listens)) {
        updates.push('listens = ?');
        values.push(listens);
    }
    if (description !== null) {
        updates.push('description = ?');
        values.push(description);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    values.push(songId);

    try {
        const result = await queryDatabase(
            `UPDATE songs SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }

        res.json({ success: true, message: 'Song updated successfully' });
    } catch (error) {
        console.error('Failed to update song:', error);
        res.status(500).json({ error: 'Failed to update song' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

(async function startServer() {
    try {
        await ensureSongsSchema();
        await pool.getConnection();
        console.log('Connected to MySQL database.');
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
