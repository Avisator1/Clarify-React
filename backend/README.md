# Clarity Backend API

A Node.js/Express backend API for the Clarity journaling app with SQLite database and JWT authentication.

## Features

- 🔐 JWT-based authentication
- 👤 User registration and login
- 🗄️ SQLite database
- 🔒 Password hashing with bcrypt
- 🌐 CORS enabled for frontend integration
- 📱 Mobile-friendly API endpoints

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run init-db
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **For development (with auto-restart):**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/profile` - Get current user profile (protected)

### Health Check

- `GET /api/health` - Server health status

## Test Credentials

After running `npm run init-db`, you can use these test credentials:

- **Email:** test@clarity.com
- **Password:** password123

## Environment Variables

Create a `config.env` file with:

```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database/clarity.db
```

## Database Schema

### Users Table
- `id` (INTEGER PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password` (TEXT - hashed)
- `firstName` (TEXT)
- `lastName` (TEXT)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

### Journal Entries Table
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER FOREIGN KEY)
- `photo_path` (TEXT)
- `mood` (INTEGER)
- `notes` (TEXT)
- `created_at` (DATETIME)

## Frontend Integration

The backend is configured to work with:
- React Native Expo app on port 19006
- Web development server on port 3000
- Mobile devices via tunnel connections

Make sure your frontend is making requests to `http://localhost:3001/api`
