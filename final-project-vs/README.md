# Music Leaderboard with Database

A full-stack music leaderboard application that stores imported song data in a NeDB database and supports local storage fallback.

## Features

- View a default rock music leaderboard
- Import custom songs with artist, listen counts, and optional descriptions
- Save imports to server-side database or local browser storage
- Automatic leaderboard refresh after import
- View statistics and clear stored data from the info page
- Search and sort songs from the leaderboard

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

4. Optional development mode:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/songs` - Get all imported songs
- `POST /api/songs` - Import new songs (expects `{songs: [...]}`)
- `DELETE /api/songs` - Clear all imported songs
- `GET /api/stats` - Get statistics (total songs, listens, average)

## Database

The app uses NeDB database files (`songs.db`, `users.db`, `user_data.db`) to store playlist and user data.

## Pages

- `/` - Leaderboard (shows imported songs if any, else defaults)
- `/import` - Import new songs and choose whether to save locally or to the database
- `/info` - View imported data, stats, and clear stored data