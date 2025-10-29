const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth header:', authHeader);
  console.log('Token:', token ? 'Token present' : 'No token');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('JWT decoded:', decoded);
    req.user = { id: decoded.userId };
    console.log('Set req.user:', req.user);
    next();
  });
};

// Get user by ID
const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, firstName, lastName, createdAt FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

// Get user by email
const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

module.exports = {
  generateToken,
  authenticateToken,
  getUserById,
  getUserByEmail
};
