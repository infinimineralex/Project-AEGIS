const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*
Registration:
Validates incoming data.
Checks for existing users.
Hashes the password using bcryptjs.
Inserts the new user into the database.
Generates a JWT token for session management.
*/
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    // Check if user exists
    const checkUserQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
    db.get(checkUserQuery, [username, email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }

        // Hash password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) { 
                return res.status(500).json({ message: 'Error hashing password.', error: hashErr.message });
            }

            // Insert new user
            const insertUserQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
            db.run(insertUserQuery, [username, email, hashedPassword], function(insertErr) {
                if (insertErr) {
                    return res.status(500).json({ message: 'Error creating user.', error: insertErr.message });
                }

                // Generate JWT (will expire in 2 hours)
                const token = jwt.sign(
                    { id: this.lastID, username },
                    process.env.JWT_SECRET,
                    { expiresIn: '2h' }
                );

                return res.status(201).json({ message: 'User registered successfully.', token });
            });
        });
    });
};

/*
Login Controller:
Validates incoming data.
Retrieves user from the database.
Compares the provided password with the hashed password.
Generates a JWT token upon successful authentication.
*/
exports.login = (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    // Fetch user
    const getUserQuery = `SELECT * FROM users WHERE username = ?`;
    db.get(getUserQuery, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        // Compare password
        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) {
                return res.status(500).json({ message: 'Error comparing passwords.', error: compareErr.message });
            }
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid username or password.' });
            }

            // Generate JWT (will expire in 2 hours)
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            return res.status(200).json({ message: 'Logged in successfully.', token });
        });
    });
};