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

})
router.post("/login", async (req,res) => {
    
})

router.post('/requestReset', async (req, res) => {
    
  });

  router.post('/resetPassword', async (req, res) => {
    
    });


module.exports = router
