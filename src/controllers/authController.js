const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

/*
Registration Controller with 2FA Enrollment:
• Validates input and ensures username/email uniqueness.
• Generates an encryption salt and hashes the password.
• Generates a TOTP secret for 2FA setup.
• Inserts the new user data along with the twofa_secret.
• Returns a JSON response with twofaSecret (otpauth URL), userId, and salt.
  (JWT token is withheld until 2FA verification is complete.)
*/
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    const checkUserQuery = `SELECT * FROM users WHERE username = $1 OR email = $2`;
    db.get(checkUserQuery, [username, email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }

        // Generate a unique encryption salt (16 bytes, hex encoded)
        const encryptionSalt = crypto.randomBytes(16).toString('hex');

        // Hash the user's password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) { 
                console.error('Hashing error:', hashErr);
                return res.status(500).json({ message: 'Error hashing password.', error: hashErr.message });
            }

            // Generate a TOTP secret for 2FA enrollment
            const twofaSecret = speakeasy.generateSecret({ 
                length: 20, 
                name: `AEGIS (${username})`, 
                issuer: 'AEGIS'
            });

            // Insert new user including the twofa_secret
            const insertUserQuery = `
                INSERT INTO users (username, email, password, encryption_salt, twofa_secret, is_verified) 
                VALUES ($1, $2, $3, $4, $5, 0)
                RETURNING id
            `;
            db.run(insertUserQuery, [username, email, hashedPassword, encryptionSalt, twofaSecret.base32], function(insertErr, result) {
                if (insertErr) {
                    console.error('DB Insert error:', insertErr);
                    return res.status(500).json({ message: 'Error creating user.', error: insertErr.message });
                }
                // Extract new user's id from the result
                const newUserId = result.rows[0].id;
                return res.status(201).json({ 
                    message: 'User registered successfully. Please verify your 2FA code.',
                    twofaSecret: twofaSecret.otpauth_url,
                    userId: newUserId,
                    salt: encryptionSalt
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

    const getUserQuery = `SELECT * FROM users WHERE username = $1`;
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

            // Generate the token including is_verified from user record.
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    email: user.email, 
                    is_verified: user.is_verified 
                },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

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
    const getUserQuery = `SELECT * FROM users WHERE id = $1`;
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
            { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                is_verified: user.is_verified 
            },
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