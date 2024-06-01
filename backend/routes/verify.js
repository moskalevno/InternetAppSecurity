const router = require("express").Router()

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const User = require("../models/user")


router.post("/send-sms", async (req,res) =>{

})


router.post('/send-code', async (req, res) => {

});

router.post('/verify-code', async (req, res) => {
    
});

module.exports = router