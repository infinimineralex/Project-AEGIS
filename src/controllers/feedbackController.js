const nodemailer = require('nodemailer');

async function getTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify the transporter configuration
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error('Transporter creation/verification error:', error);
    throw new Error(`Failed to create email transporter: ${error.message}`);
  }
}

exports.sendFeedback = async (req, res) => {
  console.log('Received feedback request:', { ...req.body, message: '[REDACTED]' });
  
  const { rating, message } = req.body;
  if (rating === undefined || message === undefined) {
    console.log('Validation failed: missing rating or message');
    return res.status(400).json({ message: 'Rating and message are required.' });
  }

  try {
    console.log('Creating email transporter...');
    const transporter = await getTransporter();
    
    console.log('Configuring mail options...');
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.FEEDBACK_EMAIL || process.env.EMAIL,
      subject: 'User Feedback',
      text: `Rating: ${rating}\n\nMessage:\n${message}`,
    };
    
    console.log('Attempting to send email...');
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email sending error details:', {
            error: err.message,
            stack: err.stack,
            code: err.code,
            command: err.command
          });
          reject(err);
          return res.status(500).json({ 
            message: 'Error sending feedback email.',
            error: err.message,
            code: err.code
          });
        }
        console.log('Email sent successfully:', info.messageId);
        resolve();
        return res.status(200).json({ 
          message: 'Feedback email sent successfully.',
          messageId: info.messageId
        });
      });
    });
  } catch (error) {
    console.error('Feedback process error details:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });
    return res.status(500).json({ 
      message: 'Failed to process feedback.',
      error: error.message,
      type: error.name
    });
  }
};
