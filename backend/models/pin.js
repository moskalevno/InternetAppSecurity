const mongoose = require("mongoose")
const reviewSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    text: { 
        type: String,
        required: true,
    },
    rating: { 
        type: Number,
        required:true,
        min: 0,
        max: 5,
    }

},{timestamps: true})
const pinSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },

    title:{
        type: String,
        required: true,
        min: 3,
        max: 60,
    },

    desc:{
        type: String,
        required: true,
        min:3,
    },

    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
    },

    countryName: {
        type: String,
        required: true,
      },

    lat: {
        type: Number,
        require: true,
    },

    long: {
        type: Number,
        require: true,
    },
    
    reviews: [reviewSchema]

},
{timestamps: true}
)

module.exports = mongoose.model("pin", pinSchema)









