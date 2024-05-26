const router = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt')
const parser = require('body-parser')
const twilio = require('twilio')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendResetEmail = require('../auth/sendResetEmail')
//r
router.post("/register", async (req,res) => {
    try{
        //generate password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        //create new user
        const newUser = new User({
            username:req.body.username,
            email:req.body.email,
            password:hashedPassword,
            phone:req.body.phone,
        })

        //save user and send response
        const user = await newUser.save()
        res.status(200).json(user._id)
    }
    catch(err){
        res.status(500).json(err)
    }
})
router.post("/login", async (req,res) => {
    try{
        //find user
        const user = await User.findOne({username:req.body.username})
        !user && res.status(400).json("Wrong username or password!")

        //validate password
        const validPassword = await bcrypt.compare(req.body.password, user.password)
        !validPassword && res.status(400).json("Wrong username or password!")

        //send res
        //res.status(200).json({_id:user._id, username:user.username})

        const token = jwt.sign(
            { _id: user._id }, // Payload
            process.env.JWT_SECRET, // Секретный ключ
            { expiresIn: '24h' } // Срок действия токена
          );
      
          // Отправка токена клиенту
          res.header('auth-token', token).status(200).json({ _id: user._id, username: user.username, token });
    }
    catch(err){
        res.status(500).json(err)
    }
})

router.post('/requestReset', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
  
    if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex'); // Генерация случайного токена
        const resetTokenExpiry = Date.now() + 3600000; // Токен истекает через 1 час
      
        // Сохраняем токен и время его истечения в модель пользователя
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
        // Здесь нужно отправить email с ссылкой для сброса пароля, содержащей токен
        sendResetEmail(user.email, `http://localhost:3000/resetPassword?token=${resetToken}`);
    }
  
    res.send('If an account with that email exists, we sent a link to reset your password.');
  });

  router.post('/resetPassword', async (req, res) => {
    //const { token, newPassword } = req.body;
    const token = req.query.token; // Извлекаем токен из параметра строки запроса
    const newPassword = req.body.password;
    console.log("token",token);
    console.log("pass",newPassword);

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });
    console.log("OK")
  
    if (!user) {
        return res.status(400).send('Token is invalid or has expired');
        }
         // Обновите пароль пользователя, предварительно захешировав его
  user.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();
    
        res.send('Your password has been changed');
    });


module.exports = router
