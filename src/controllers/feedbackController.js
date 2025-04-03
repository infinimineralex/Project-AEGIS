const nodemailer = require('nodemailer');
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
        return reject("Failed to create access token");
      }
      resolve(token);
    });
  });
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {      
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
      // Soon we re-enable OAuth2: type, clientId, clientSecret, refreshToken, accessToken
    },
  });
}

exports.sendFeedback = async (req, res) => {
  const { rating, message } = req.body;
  if (rating === undefined || message === undefined) {
    return res.status(400).json({ message: 'Rating and message are required.' });
  }

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL,
      to: 'projectaegismanagement@gmail.com',
      subject: 'User Feedback',
      text: `Rating: ${rating}\n\nMessage:\n${message}`,
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ message: 'Error sending feedback email.' });
      }
      return res.status(200).json({ message: 'Feedback email sent successfully.' });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process feedback.', error: error.message });
  }
};
