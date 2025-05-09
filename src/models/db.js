const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL,
  ssl: {
    // false as I haven't created full cert:
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL via Railway');
});

const createTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        encryption_salt TEXT NOT NULL,
        twofa_secret TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Passwords table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS passwords (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          website TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
  
      // Verification Codes table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            type TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        TRUNCATE TABLE verification_codes;
    `);

    console.log('Tables are set up');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

// Initialize table creation
createTables();

// Helper functions to mimic sqlite3’s API
const db = {
  run: (text, params, callback) => {
    pool.query(text, params)
      .then(result => callback && callback(null, result))
      .catch(err => callback && callback(err));
  },

  get: (text, params, callback) => {
    pool.query(text, params)
      .then(result => callback(null, result.rows[0]))
      .catch(err => callback(err));
  },

  all: (text, params, callback) => {
    pool.query(text, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  },

  // If raw access is needed:
  query: (text, params) => pool.query(text, params),
};

module.exports = db;
