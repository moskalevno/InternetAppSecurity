const router = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const sendResetEmail = require('../auth/sendResetEmail')
const sendVerificationEmail = require('../auth/sendVerificationEmail');

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // генерим 6-значный код
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registered successfully
 *       500:
 *         description: Internal server error
 */


// регистрация
router.post("/register", async (req, res) => {
    try {
        console.log("Received register request");
        // пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const verificationCodeEmail = generateVerificationCode();
        // новый пользователь
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            verificationCodeEmail,
            isVerified: false
        });
        // Сохранить пользователя и отправить ответ
        const user = await newUser.save();
        sendVerificationEmail(user.email, verificationCodeEmail);
        res.status(200).json({ userId: user._id });
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Wrong username or password
 *       500:
 *         description: Internal server error
 */

router.post("/login", async (req,res) => {
    try{
        //найти пользователя
        const user = await User.findOne({username:req.body.username})
        !user && res.status(400).json("Wrong username or password!")
        //проверить пароль
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
        res.header('auth-token', token).status(200).json({ _id: user._id, username: user.username, token });    // Отправка токена клиенту
    }
    catch(err){
        res.status(500).json(err)
    }
})

/**
 * @swagger
 * /api/users/verify:
 *   post:
 *     summary: Verify a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: User verified successfully
 *       400:
 *         description: Incorrect verification code
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /api/users/requestReset:
 *   post:
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: If an account with that email exists, we sent a link to reset your password
 *       500:
 *         description: Internal server error
 */

router.post('/requestReset', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex'); // Генерация случайного токена
        const resetTokenExpiry = Date.now() + 3600000; // Токен истекает через 1 час
        user.resetToken = resetToken;           // Сохраняем токен и время его истечения в модель пользователя
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
        sendResetEmail(user.email, `http://localhost:3000/resetPassword?token=${resetToken}`); // отправить email с ссылкой для сброса пароля c токеном
    }
    res.send('If an account with that email exists, we sent a link to reset your password.');
});

/**
 * @swagger
 * /api/users/resetPassword:
 *   post:
 *     summary: Reset password
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Token is invalid or has expired
 *       500:
 *         description: Internal server error
 */

router.post('/resetPassword', async (req, res) => {
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
    user.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));   // обновляем пароль и хэшируем
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.send('Your password has been changed');
    });

module.exports = router
