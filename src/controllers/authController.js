const supabase = require('../models/supabase');
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
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    // Check for existing user
    const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${email}`)
        .single();

    if (selectError && selectError.code !== 'PGRST116') { // record not found will have a specific code
        return res.status(500).json({ message: 'Database error.', error: selectError.message });
    }
    if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // Generate a unique encryption salt and hash password
    const encryptionSalt = crypto.randomBytes(16).toString('hex');
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
        console.error('Hashing error:', hashErr);
        return res.status(500).json({ message: 'Error hashing password.', error: hashErr.message });
    }

    // Generate 2FA secret
    const twofaSecret = speakeasy.generateSecret({ length: 20 });

    // Insert new user into Supabase
    const { data, error: insertError } = await supabase
        .from('users')
        .insert([{
            username,
            email,
            password: hashedPassword,
            encryption_salt: encryptionSalt,
            twofa_secret: twofaSecret.base32
        }])
        .single();
        
    if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({ message: 'Error creating user.', error: insertError.message });
    }

    // Generate JWT (expires in 2 hours)
    const token = jwt.sign(
        { id: data.id, username },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(201).json({ 
        message: 'User registered successfully.',
        token,
        salt: encryptionSalt,
        twofaSecret: twofaSecret.otpauth_url
    });
};

/*
Login Controller:
Validates incoming data.
Retrieves user from the database.
Compares the provided password with the hashed password.
Generates a JWT token upon successful authentication.
*/
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (selectError && selectError.code !== 'PGRST116') {
        return res.status(500).json({ message: 'Database error.', error: selectError.message });
    }
    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
};

exports.verify2FA = async (req, res) => {
    const { userId, token: userToken } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (selectError || !user) {
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
};