const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const authRouter = require("./routers/authRouter");
const projectsRouter = require('./routers/projectsRouter');

const allowedOrigins = [
    'http://localhost:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

const startServer = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connected successfully to DB");
        app.listen(process.env.PORT, () => {
            console.log(`server started at PORT : ${process.env.PORT}`);
        })
    }catch(err){
        console.log(err);
    }
}

startServer();