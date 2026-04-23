# 🗄️ Database Setup - Quick Start Guide

## ✅ What's Been Added

Your website now has a complete **user management system** with SQLite database:

### Three Main Tables:
1. **`users`** - Stores user accounts (username, email, password)
2. **`user_data`** - Stores custom key-value data per user
3. **`songs`** - Existing songs table (unchanged)

---

## 🚀 Getting Started

### 1. Start Your Server
```bash
npm start
```

The database (`songs.db`) will be automatically created in your project folder.

### 2. Test the Database
Open your browser and visit:
```
http://localhost:3000/user-database-example.html
```

This page demonstrates:
- User registration
- User login
- Saving custom data
- Retrieving data
- Deleting data

---

## 📝 Using in Your HTML Files

### Add the Client Library
Include this in your HTML `<head>`:
```html
<script src="db-client.js"></script>
```

### Example: Register a User
```html
<button onclick="registerUser()">Sign Up</button>

<script>
async function registerUser() {
    const result = await db.register('john_doe', 'john@example.com', 'password123');
    if (result.userId) {
        console.log('Registered:', result.username);
    } else {
        console.error('Error:', result.error);
    }
}
</script>
```

### Example: Save User Preferences
```javascript
// Save user's favorite song
await db.saveData('favorite_song', 'Blinding Lights');

// Save high score
await db.saveData('high_score', '5000');

// Save a profile as JSON
await db.saveObject('profile', {
    name: 'John Doe',
    age: 25,
    bio: 'Music lover'
});
```

### Example: Retrieve Data
```javascript
// Get a specific data item
const favSong = await db.getData('favorite_song');
console.log('Your favorite:', favSong.data_value);

// Get all user data
const allData = await db.getAllData();
console.log('Your data:', allData);

// Get a saved object
const profile = await db.getObject('profile');
console.log('Profile:', profile);
```

---

## 🔑 Key Features

### User Authentication
```javascript
// Login
await db.login('john_doe', 'password123');

// Check if logged in
if (db.isLoggedIn()) {
    console.log('User:', db.username);
}

// Logout
db.logout();
```

### Persistent Storage
- User data automatically saves to browser's `localStorage`
- User info persists across page refreshes
- Data is stored in SQLite on the server

### Easy Data Management
```javascript
// Update existing data
await db.saveData('high_score', '10000');

// Delete data
await db.deleteData('high_score');

// Get user profile
const profile = await db.getUserProfile();
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/users/:id` | Get user profile |
| `POST` | `/api/users/:id/data` | Save user data |
| `GET` | `/api/users/:id/data` | Get all user data |
| `GET` | `/api/users/:id/data/:key` | Get specific data |
| `DELETE` | `/api/users/:id/data/:key` | Delete data |

---

## 📚 Full API Documentation

See [DATABASE.md](DATABASE.md) for complete endpoint documentation with examples.

---

## 🛡️ Security Notes

⚠️ **For Development Only** - This uses basic SHA-256 hashing.

**For Production**, upgrade to:
- **bcrypt** for password hashing
- **JWT tokens** for session management
- **HTTPS/SSL** for encryption
- **Rate limiting** on auth endpoints
- **Input validation** on all endpoints

### Install bcrypt:
```bash
npm install bcrypt
```

---

## 📖 Example Use Cases

### Leaderboard with User Scores
```javascript
// Save user score
await db.saveData('leaderboard_score', '9500');
await db.saveData('rank', '1');

// In leaderboard.html, fetch and display
```

### User Preferences
```javascript
// Save preferences
await db.saveObject('preferences', {
    theme: 'dark',
    language: 'en',
    notifications: true
});
```

### Comments/Reviews
```javascript
// Save user comment
await db.saveObject('song_review', {
    songId: 123,
    rating: 5,
    comment: 'Great song!'
});
```

---

## 🐛 Troubleshooting

**"Database connection failed"**
- Make sure you're running `npm start`
- Check that `server.js` is in your project root

**"User already exists"**
- That username or email is taken
- Try a different one

**"Data not found"**
- Make sure you saved data first
- Check you're using the correct key name

**Can't login after registering?**
- Check username and password are correct
- Try logging out and back in

---

## 📂 Files Created/Modified

- ✅ `server.js` - Updated with user authentication and data storage
- ✅ `db-client.js` - New: Client-side helper library
- ✅ `user-database-example.html` - New: Full working example
- ✅ `DATABASE.md` - New: API documentation
- ✅ `QUICKSTART.md` - New: This file

---

## 💡 Next Steps

1. **Run the server**: `npm start`
2. **Test it**: Open `http://localhost:3000/user-database-example.html`
3. **Integrate into your pages**: Add `<script src="db-client.js"></script>` to your HTML
4. **Use the API**: Call `db.login()`, `db.saveData()`, etc.

Happy building! 🎉
