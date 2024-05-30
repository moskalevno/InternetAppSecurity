const mongoose = require("mongoose")

//const Schema = mongoose.Schema


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        min: 3,
        max: 20,
        unique: true,
    },
    email: {
        type: String,
        require: true,
        max: 50,
        unique: true
    },

    password: {
        type: String,
        require:true,
        min: 6,
    },

    phone:{
        type: String,
        unique: true
        
    },
    verificationCode: {
        code: String,
        expiresAt: Date,
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    }
    
},
{timestamps: true}
)

module.exports = mongoose.model("user", userSchema)









