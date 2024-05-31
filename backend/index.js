const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require('body-parser');
const dotenv = require("dotenv")
const userRoute = require("./routes/users")
const pinRoute = require("./routes/pins")
const verifyRoute = require("./routes/verify")
const reviewRoute = require("./routes/reviews")
//const authMiddleware = require('./auth/authMiddleware');

const app = express()

dotenv.config()

app.use(express.json())
app.use(bodyParser.json());

var cors = require('cors')

app.use(cors()) // Use this after the variable declaration

mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true}).then (() => {
    console.log("mongoDB connected")
}).catch ((err) => console.log(err));

app.use("/api/verify",verifyRoute)
app.use("/api/users", userRoute)
app.use("/api/pins", pinRoute)
app.use("/api/reviews",reviewRoute)




app.listen(8800, () => {
    console.log("backend server is running")
})