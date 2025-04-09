const db = require('../models/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

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
      // type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
      // clientId: process.env.CLIENT_ID,
      // clientSecret: process.env.CLIENT_SECRET,
      // refreshToken: process.env.REFRESH_TOKEN,
      // accessToken: accessToken,
    },
  });
}

exports.sendVerificationEmail = async (req, res) => {
  const { userId, email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  const insertQuery = `
    INSERT INTO verification_codes (user_id, code, type, expires_at)
    VALUES ($1, $2, 'email_verification', NOW() + INTERVAL '10 minutes')
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
  const selectQuery = `SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = 'email_verification' AND expires_at > NOW()`;
  db.get(selectQuery, [userId, code], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }
    const updateQuery = `UPDATE users SET is_verified = 1 WHERE id = $1 RETURNING username, email`;
    db.run(updateQuery, [userId], function (err, result) {
      if (err) {
        return res.status(500).json({ message: 'Error updating verification status.' });
      }

      // Generate a new token with updated verification status
      const user = result.rows[0];
      const token = jwt.sign(
        { 
          id: userId, 
          username: user.username, 
          email: user.email,
          is_verified: 1
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Cleanup the code record
      db.run(`DELETE FROM verification_codes WHERE id = $1`, [row.id]);
      
      return res.status(200).json({ 
        message: 'Email verified successfully.',
        token: token
      });
    });
  });
};

exports.requestAccountDeletion = async (req, res) => {
  const { userId, email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  const insertQuery = `
    INSERT INTO verification_codes (user_id, code, type, expires_at)
    VALUES ($1, $2, 'account_deletion', NOW() + INTERVAL '10 minutes')
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
  const selectQuery = `SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = 'account_deletion' AND expires_at > NOW()`;
  db.get(selectQuery, [userId, code], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ message: 'Invalid or expired deletion code.' });
    }
    const deleteUserQuery = `DELETE FROM users WHERE id = $1`;
    db.run(deleteUserQuery, [userId], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error deleting account.' });
      }
      // Clean up any codes for this user.
      db.run(`DELETE FROM verification_codes WHERE user_id = $1`, [userId]);
      return res.status(200).json({ message: 'Account deleted successfully.' });
    });
  });
};

// New Password Reset Endpoints

// Request a password reset code only if the user's email is verified.
exports.requestPasswordReset = async (req, res) => {
  const { userId, email } = req.body;
  
  // Check if the user's email is verified.
  const userQuery = `SELECT is_verified FROM users WHERE id = $1`;
  db.get(userQuery, [userId], async (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ message: 'User not found.' });
    }
    if (userRow.is_verified !== 1) {
      return res.status(400).json({ message: 'Email is not verified. Please verify your email first.' });
    }
    
    const code = crypto.randomBytes(3).toString('hex');
    const insertQuery = `
      INSERT INTO verification_codes (user_id, code, type, expires_at)
      VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '10 minutes')
    `;
    db.run(insertQuery, [userId, code], async function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error generating password reset code.' });
      }
      try {
        const transporter = await getTransporter();
        transporter.sendMail(
          {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset Verification Code',
            text: `Your password reset code is: ${code}`,
          },
          (err, info) => {
            if (err) {
              return res.status(500).json({ message: 'Error sending password reset email.' });
            }
            return res.status(200).json({ message: 'Password reset email sent.' });
          }
        );
      } catch (error) {
        return res.status(500).json({ message: 'Failed to create transporter.', error: error.message });
      }
    });
  });
};

// Confirm the password reset, ensuring the email is verified and hashing the new password.
exports.confirmPasswordReset = (req, res) => {
  const { userId, code, newPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({ message: 'New password must be provided.' });
  }
  
  // First, check if the user's email is verified.
  const userQuery = `SELECT is_verified FROM users WHERE id = $1`;
  db.get(userQuery, [userId], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ message: 'User not found.' });
    }
    if (userRow.is_verified !== 1) {
      return res.status(400).json({ message: 'Email is not verified. Cannot reset password.' });
    }
    
    // Now, verify the reset code.
    const selectQuery = `
      SELECT * FROM verification_codes 
      WHERE user_id = $1 AND code = $2 AND type = 'password_reset' AND expires_at > NOW()
    `;
    db.get(selectQuery, [userId, code], (err, row) => {
      if (err || !row) {
        return res.status(400).json({ message: 'Invalid or expired password reset code.' });
      }
      // Hash the new password using bcrypt.
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
         if (err) {
           return res.status(500).json({ message: 'Error hashing password.' });
         }
         const updateQuery = `UPDATE users SET password = $1 WHERE id = $2`;
         db.run(updateQuery, [hashedPassword, userId], function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error updating password.' });
            }
            // Clean up the used code.
            db.run(`DELETE FROM verification_codes WHERE id = $1`, [row.id]);
            return res.status(200).json({ message: 'Password updated successfully.' });
         });
      });
    });
  });
};
