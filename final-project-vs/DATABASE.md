# Database Documentation

## Overview
Your website now has a SQLite database (`songs.db`) with three main tables: **users**, **user_data**, and **songs**.

## Database Tables

### 1. `users` Table
Stores user account information.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
)
```

**Fields:**
- `id` - Unique user identifier
- `username` - Unique username
- `email` - Unique email address
- `password` - SHA-256 hashed password
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

---

### 2. `user_data` Table
Stores custom key-value data for each user.

```sql
CREATE TABLE user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_key TEXT NOT NULL,
    data_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, data_key)
)
```

**Fields:**
- `id` - Unique record identifier
- `user_id` - Reference to user
- `data_key` - Data key (e.g., "favorite_song", "high_score")
- `data_value` - Data value (stored as text)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 3. `songs` Table
Stores song information (existing).

```sql
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    listens INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123"
}

Response:
{
    "message": "User registered successfully",
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
    "username": "john_doe",
    "password": "securepassword123"
}

Response:
{
    "message": "Login successful",
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com"
}
```

---

### User Management

#### Get All Users
```
GET /api/users

Response:
[
    {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "created_at": "2026-04-23 10:30:00",
        "last_login": "2026-04-23 11:45:00"
    }
]
```

#### Get Specific User
```
GET /api/users/:userId

Response:
{
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2026-04-23 10:30:00",
    "last_login": "2026-04-23 11:45:00"
}
```

---

### User Data Storage

#### Save/Update User Data
```
POST /api/users/:userId/data
Content-Type: application/json

{
    "key": "favorite_song",
    "value": "Blinding Lights"
}

Response:
{
    "message": "Data saved successfully",
    "key": "favorite_song",
    "value": "Blinding Lights"
}
```

#### Get User Data by Key
```
GET /api/users/:userId/data/:key

Response:
{
    "id": 5,
    "user_id": 1,
    "data_key": "favorite_song",
    "data_value": "Blinding Lights",
    "created_at": "2026-04-23 10:35:00",
    "updated_at": "2026-04-23 10:35:00"
}
```

#### Get All User Data
```
GET /api/users/:userId/data

Response:
[
    {
        "data_key": "favorite_song",
        "data_value": "Blinding Lights",
        "created_at": "2026-04-23 10:35:00",
        "updated_at": "2026-04-23 10:35:00"
    },
    {
        "data_key": "high_score",
        "data_value": "5000",
        "created_at": "2026-04-23 10:40:00",
        "updated_at": "2026-04-23 10:40:00"
    }
]
```

#### Delete User Data
```
DELETE /api/users/:userId/data/:key

Response:
{
    "message": "Data deleted successfully",
    "deletedRows": 1
}
```

---

## Usage Examples

### JavaScript Client-Side Example

```javascript
// Register
async function registerUser() {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'john_doe',
            email: 'john@example.com',
            password: 'securepassword123'
        })
    });
    const data = await response.json();
    console.log(data);
    return data.userId;
}

// Login
async function loginUser() {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'john_doe',
            password: 'securepassword123'
        })
    });
    const data = await response.json();
    localStorage.setItem('userId', data.userId);
    return data.userId;
}

// Save user data
async function saveUserData(userId, key, value) {
    const response = await fetch(`/api/users/${userId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    return await response.json();
}

// Get user data
async function getUserData(userId, key) {
    const response = await fetch(`/api/users/${userId}/data/${key}`);
    return await response.json();
}

// Get all user data
async function getAllUserData(userId) {
    const response = await fetch(`/api/users/${userId}/data`);
    return await response.json();
}
```

---

## Security Notes

⚠️ **Important:** This basic implementation uses SHA-256 hashing. For production use, consider:
- Using bcrypt for better password hashing
- Implementing JWT tokens for session management
- Adding HTTPS/SSL encryption
- Validating and sanitizing all inputs
- Implementing rate limiting on auth endpoints

---

## File Location
Database file: `./songs.db` (auto-created in project root)
