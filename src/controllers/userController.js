const db = require('../models/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

async function getTransporter() {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        return reject("Failed to create access token :(");
      }
      resolve(token);
    });
  });

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { // re-enable OAuth2 for security purposes later
      //type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
      //clientId: process.env.CLIENT_ID,
      //clientSecret: process.env.CLIENT_SECRET,
      //refreshToken: process.env.REFRESH_TOKEN,
      //accessToken: accessToken,
    },
  });
}

exports.sendVerificationEmail = async (req, res) => {
  const { userId, email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  const insertQuery = `
    INSERT INTO verification_codes (user_id, code, type, expires_at)
    VALUES (?, ?, 'email_verification', datetime('now', '+10 minutes'))
  `;
  db.run(insertQuery, [userId, code], async function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error generating verification code.' });
    }
    try {
      const transporter = await getTransporter();
      transporter.sendMail(
        {
          from: process.env.EMAIL,
          to: email,
          subject: 'Email Verification Code',
          text: `Welcome to AEGIS: the future of password management! Your email verification code is: ${code}`,
        },
        (err, info) => {
          if (err) {
            return res.status(500).json({ message: 'Error sending email.' });
          }
          return res.status(200).json({ message: 'Verification email sent.' });
        }
      );
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create transporter.', error: error.message });
    }
  });
};

exports.verifyEmail = (req, res) => {
  const { userId, code } = req.body;
  const selectQuery = `SELECT * FROM verification_codes WHERE user_id = ? AND code = ? AND type = 'email_verification' AND expires_at > datetime('now')`;
  db.get(selectQuery, [userId, code], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }
    const updateQuery = `UPDATE users SET is_verified = 1 WHERE id = ?`;
    db.run(updateQuery, [userId], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating verification status.' });
      }
      // Optionally cleanup the code record
      db.run(`DELETE FROM verification_codes WHERE id = ?`, [row.id]);
      return res.status(200).json({ message: 'Email verified successfully.' });
    });
  });
};

exports.requestAccountDeletion = async (req, res) => {
  const { userId, email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  const insertQuery = `
    INSERT INTO verification_codes (user_id, code, type, expires_at)
    VALUES (?, ?, 'account_deletion', datetime('now', '+10 minutes'))
  `;
  db.run(insertQuery, [userId, code], async function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error generating deletion code.' });
    }
    try {
      const transporter = await getTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Account Deletion Verification Code',
        text: `Your account deletion code is: ${code}`,
      });
      return res.status(200).json({ message: 'Deletion verification email sent.' });
    } catch (error) {
      console.error("Error sending deletion email:", error);
      return res.status(500).json({ message: 'Failed to send deletion email: ' + error });
    }
  });
};

exports.confirmAccountDeletion = (req, res) => {
  const { userId, code } = req.body;
  const selectQuery = `SELECT * FROM verification_codes WHERE user_id = ? AND code = ? AND type = 'account_deletion' AND expires_at > datetime('now')`;
  db.get(selectQuery, [userId, code], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ message: 'Invalid or expired deletion code.' });
    }
    const deleteUserQuery = `DELETE FROM users WHERE id = ?`;
    db.run(deleteUserQuery, [userId], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error deleting account.' });
      }
      // Clean up any codes for this user.
      db.run(`DELETE FROM verification_codes WHERE user_id = ?`, [userId]);
      return res.status(200).json({ message: 'Account deleted successfully.' });
    });
  });
};