const nodemailer = require('nodemailer');

const sendVerificationEmail = (email, code) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your Verification Code',
    html: `Your verification code is: <strong>${code}</strong>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = sendVerificationEmail;
