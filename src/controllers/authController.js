const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

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

    const checkUserQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
    db.get(checkUserQuery, [username, email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }

        // Generate a unique salt (16 bytes, hex encoded)
        const encryptionSalt = crypto.randomBytes(16).toString('hex');

        // Hash password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) { 
                console.error('Hashing error:', hashErr);
                return res.status(500).json({ message: 'Error hashing password.', error: hashErr.message });
            }

            // Generate TOTP secret for 2FA enrollment
            const twofaSecret = speakeasy.generateSecret({ length: 20 });

            // Insert new user including the encryptionSalt and twofaSecret
            const insertUserQuery = `INSERT INTO users (username, email, password, encryption_salt, twofa_secret) VALUES (?, ?, ?, ?, ?)`;
            db.run(insertUserQuery, [username, email, hashedPassword, encryptionSalt, twofaSecret.base32], function(insertErr) {
                if (insertErr) {
                    console.error('DB Insert error:', insertErr);
                    return res.status(500).json({ message: 'Error creating user.', error: insertErr.message });
                }

                // Generate JWT (expires in 2 hours)
                const token = jwt.sign(
                    { id: this.lastID, username },
                    process.env.JWT_SECRET,
                    { expiresIn: '2h' }
                );

                // Should send back the twofa enrollment URL or secret for the client to set up their authenticator app.
                return res.status(201).json({ 
                    message: 'User registered successfully.',
                    token,
                    salt: encryptionSalt,
                    twofaSecret: twofaSecret.otpauth_url
                });
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

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    const getUserQuery = `SELECT * FROM users WHERE username = ?`;
    db.get(getUserQuery, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) {
                return res.status(500).json({ message: 'Error comparing passwords.', error: compareErr.message });
            }
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid username or password.' });
            }

            // If twofa_secret is set, require 2FA verification first.
            if (user.twofa_secret) {
                return res.status(200).json({ 
                    message: '2FA required.',
                    twofaRequired: true,
                    tempUserId: user.id,
                    salt: user.encryption_salt
                });
            }

            // If no 2FA, generate the token directly.
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            // Return token along with the stored encryption salt
            return res.status(200).json({ 
                message: 'Logged in successfully.',
                token,
                salt: user.encryption_salt
            });
        });
    });
};

exports.verify2FA = (req, res) => {
    const { userId, token: userToken } = req.body;
    const getUserQuery = `SELECT * FROM users WHERE id = ?`;
    db.get(getUserQuery, [userId], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'User not found.' });
        }
        const verified = speakeasy.totp.verify({
            secret: user.twofa_secret,
            encoding: 'base32',
            token: userToken,
        });
        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA token.' });
        }
        const jwtToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        return res.status(200).json({ 
            message: 'Logged in successfully.',
            token: jwtToken,
            salt: user.encryption_salt
        });
    });
};