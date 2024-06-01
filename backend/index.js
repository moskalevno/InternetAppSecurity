const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require('body-parser');
const dotenv = require("dotenv")
const userRoute = require("./routes/users")
const pinRoute = require("./routes/pins")
const verifyRoute = require("./routes/verify")
const reviewRoute = require("./routes/reviews")
const swaggerSetup = require('./swagger'); // Путь к файлу swagger.js
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express()
dotenv.config()
app.use(express.json())
app.use(bodyParser.json());
var cors = require('cors')
app.use(cors()) 

mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true}).then (() => {
    console.log("mongoDB connected")
}).catch ((err) => console.log(err));

app.use("/api/verify",verifyRoute)
app.use("/api/users", userRoute)
app.use("/api/pins", pinRoute)
app.use("/api/reviews",reviewRoute)

swaggerSetup(app);
app.listen(8800, () => {
    console.log("backend server is running")
})