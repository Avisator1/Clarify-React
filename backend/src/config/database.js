const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database/clarity.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
        } else {
          console.log('Users table created successfully');
        }
      });

      // Create journal_entries table
      db.run(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          photo_path TEXT,
          mood TEXT,
          notes TEXT,
          emotions TEXT,
          primary_emotion TEXT,
          secondary_emotion TEXT,
          intensity INTEGER,
          insights TEXT,
          tips TEXT,
          confidence INTEGER,
          facial_analysis TEXT,
          mood_factors TEXT,
          wellness_indicators TEXT,
          recommendations TEXT,
          quick_insight TEXT,
          detailed_insights TEXT,
          mood_trends TEXT,
          chart_data TEXT,
          analysis_summary TEXT,
          additional_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating journal_entries table:', err.message);
          reject(err);
        } else {
          console.log('Journal entries table created successfully');
        }
      });

      // Create a test user
      const testEmail = 'test@clarity.com';
      const testPassword = 'password123';
      const hashedPassword = bcrypt.hashSync(testPassword, 10);

      db.run(`
        INSERT OR IGNORE INTO users (email, password, firstName, lastName)
        VALUES (?, ?, ?, ?)
      `, [testEmail, hashedPassword, 'Test', 'User'], (err) => {
        if (err) {
          console.error('Error creating test user:', err.message);
          reject(err);
        } else {
          console.log('Test user created successfully');
          console.log('Test credentials:');
          console.log('Email:', testEmail);
          console.log('Password:', testPassword);
          resolve();
        }
      });
    });
  });
};

// Close database connection
const closeDatabase = () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
};

module.exports = {
  db,
  initDatabase,
  closeDatabase
};
