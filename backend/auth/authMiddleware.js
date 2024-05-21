const router = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt')
const parser = require('body-parser')
const twilio = require('twilio')
const jwt = require('jsonwebtoken')
const authMiddleware = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');
  
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log(verified); // Логируем данные после верификации токена
      req.user = verified;
      next();
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }

  module.exports = authMiddleware