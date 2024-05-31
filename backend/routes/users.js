const router = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const sendResetEmail = require('../auth/sendResetEmail')
const sendVerificationEmail = require('../auth/sendVerificationEmail');
const { ContentContextImpl } = require("twilio/lib/rest/content/v1/content");



//r
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Генерируем 6-значный код
};

// Register endpoint
router.post("/register", async (req, res) => {
    try {
        console.log("Received register request");
        // Generate password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const verificationCodeEmail = generateVerificationCode();

        // Create new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            verificationCodeEmail,
            isVerified: false
        });

        // Save user and send response
        const user = await newUser.save();
        sendVerificationEmail(user.email, verificationCodeEmail);
        res.status(200).json({ userId: user._id });
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/login", async (req,res) => {
    try{
        //find user
        const user = await User.findOne({username:req.body.username})
        !user && res.status(400).json("Wrong username or password!")
        //validate password
        const validPassword = await bcrypt.compare(req.body.password, user.password)
        !validPassword && res.status(400).json("Wrong username or password!")

        if (!user.isVerified) {
            const verificationCodeEmail = generateVerificationCode();
            user.verificationCodeEmail = verificationCodeEmail;
            
            await user.save();
            sendVerificationEmail(user.email, verificationCodeEmail);
            return res.status(200).json({ userId: user._id, message: 'Verification code sent to your email' });
          }

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

router.post('/verify', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(400).json('User not found!');

        if (user.verificationCodeEmail === code) {
            user.isVerified = true;
            user.verificationCodeEmail = null;
            await user.save();
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res.header('auth-token', token).status(200).json({ _id: user._id, username: user.username, token });
    } 
        else {
            return res.status(400).json('Incorrect verification code!');
        }
    } 
    catch (err) {
        res.status(500).json(err);
    }
});

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
