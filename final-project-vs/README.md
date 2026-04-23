# Music Leaderboard with Database

A full-stack music leaderboard application that stores imported song data in an SQLite database.

## Features

- View default rock songs leaderboard
- Import custom songs with artist and listen counts
- Persistent storage in SQLite database
- View imported data statistics
- Search and sort functionality

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## API Endpoints

- `GET /api/songs` - Get all imported songs
- `POST /api/songs` - Import new songs (expects `{songs: [...]}`)
- `DELETE /api/songs` - Clear all imported songs
- `GET /api/stats` - Get statistics (total songs, listens, average)

## Database

The app uses SQLite (`songs.db`) with a `songs` table containing:
- id (auto-increment)
- title
- artist
- listens
- created_at

## Pages

- `/` - Leaderboard (shows imported songs if any, else defaults)
- `/import` - Import new songs
- `/info` - View imported data and statistics