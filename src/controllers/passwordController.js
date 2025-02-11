const db = require('../models/db');

/*
Since encryption is handled client-side, the password field stored in the database is the AES-256 encrypted string.
Here I ensure that the client securely handles encryption and decryption using the master password.
*/

/*
Validates required fields.
Inserts the encrypted credential into the database.
*/
exports.createCredential = (req, res) => {
    const userId = req.user.id;
    const { website, username, password, notes } = req.body;

    // Validate input
    if (!website || !username || !password) {
        return res.status(400).json({ message: 'Please provide website, username, and password.' });
    }

    const insertPasswordQuery = `
        INSERT INTO passwords (user_id, website, username, password, notes)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(
        insertPasswordQuery,
        [userId, website, username, password, notes || ''],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error saving credential.', error: err.message });
            }
            return res.status(201).json({ 
                message: 'Credential saved successfully.', 
                credentialId: this.lastID 
            });
        }
    );
};

// Get all credentials for the authenticated user
exports.getAllCredentials = (req, res) => {
    const userId = req.user.id;

    const getCredentialsQuery = `
        SELECT id, website, username, password, notes, created_at, updated_at 
        FROM passwords 
        WHERE user_id = ?
    `;

    db.all(getCredentialsQuery, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching credentials.', error: err.message });
        }
        return res.status(200).json({ credentials: rows });
    });
};

/*
Validates input.
Updates the specified credential if it belongs to the user.
*/
exports.updateCredential = (req, res) => {
    const userId = req.user.id;
    const credentialId = req.params.id;
    const { website, username, password, notes } = req.body;

    // Validate input
    if (!website || !username || !password) {
        return res.status(400).json({ message: 'Please provide website, username, and password.' });
    }

    const updateQuery = `
        UPDATE passwords 
        SET website = ?, username = ?, password = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
    `;

    db.run(
        updateQuery,
        [website, username, password, notes || '', credentialId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error updating credential.', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Credential not found.' });
            }
            return res.status(200).json({ message: 'Credential updated successfully.' });
        }
    );
};

// Deletes the specified credential if it belongs to the user.
exports.deleteCredential = (req, res) => {
    const userId = req.user.id;
    const credentialId = req.params.id;

    const deleteQuery = `
        DELETE FROM passwords 
        WHERE id = ? AND user_id = ?
    `;

    db.run(deleteQuery, [credentialId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting credential.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Credential not found.' });
        }
        return res.status(200).json({ message: 'Credential deleted successfully.' });
    });
};