const nodemailer = require('nodemailer');

const sendResetEmail = (email, link) => {
  // Создаем транспорт, который является способом отправки почты
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // любой SMTP сервис, например Gmail
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL, //реальный email
      pass: process.env.EMAIL_PASSWORD // реальный пароль от email
    }
  });

  // Определяем параметры письма
  const mailOptions = {
    from: process.env.EMAIL, // адрес отправителя
    to: email, // адрес получателя
    subject: 'Password Reset', // Тема письма
    html: `Для сброса пароля перейдите по ссылке: <a href="${link}">${link}</a>` // тело письма
  };

  // Отправляем почту
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Ошибка при отправке письма: ', error);
    } else {
      console.log(`Письмо отправлено: ${info.response}`);
    }
  });
};

module.exports = sendResetEmail;