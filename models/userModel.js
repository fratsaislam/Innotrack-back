const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email:{
        type: String,
        required: [true, `Email is required`],
        trim: true,
        unique: [true, `Email must be unique`],
        minLength: [5, `Email must have 5 characters at least`],
        lowercase: true,
    },
    password:{
        type: String,
        required: [true, `Password must be Provided`],
        trim: true,
        select: false, // password should not be fetched from db automaticaly, if we dont tell db to select password , it wont be , security thing , Important
    },
    username:{
        type: String,
        required: [true, `Username must be provided`],
        trim: true,
    },
    profilePic:{
        type: String,
    },
    phone:{
        type: Number,
        required: true
    },
    birth:{
        type: Date,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // limits values
        default: 'user'
    },
    verified:{
        type: Boolean,
        default: false,
    },
    verificationCode:{
        type: String,
        select: false,
    },
    verificationCodeValidation:{
        type: Number,
        select: false,
    },
    forgotPasswordCode:{
        type: String,
        select: false,
    },
    forgotPasswordCodeValidation:{
        type: Number,
        select: false,
    }
},{
    timestamps : true
})

module.exports = mongoose.model("User", userSchema);