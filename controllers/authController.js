const { signupSchema, signinSchema, changePasswordSchema, acceptCodeSchema, accpetFPCodeSchema, changeEmailSchema } = require("../middlewares/validator");
const User = require("../models/userModel");
const {doHash, doHashValidator, hmacProcess} = require("../utils/hashing");
const jwt = require("jsonwebtoken");
const transport = require("../middlewares/sendMail");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

require('dotenv').config();

exports.signup = async (req, res) => {
    const { email, password, username, birth, phone} = req.body;
    try{
        const {error, value} = signupSchema.validate({ email, password, username, phone });
        if(error){
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }, { username }]
        });
        if(existingUser){
            return res.status(402).json({success:false, message: 'user already exist'});
        }

        const hashedPassword = await doHash(password, 12);

        const result = await User.create({
            email,
            password: hashedPassword,
            username,
            phone,
            birth
        });

        result.password = undefined;
        res.status(201).json({
            success: true,
            message: 'Your Account Has Been Created Successfully !',
            data: result
        })
    }catch(err){
        console.log(err);
    }
}

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try{
        const { error, value } = signinSchema.validate({ email, password });
        if(error){
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        const existingUser = await User.findOne({ email }).select("+password");
        if(!existingUser){
            return res.status(400).json({success:false, message: 'user does not exist'});
        }

        const result = await doHashValidator(password, existingUser.password);
        if(!result){
            return res.status(401).json({success:false, message: "invalid Crudentiel!"});
        }

        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            username: existingUser.username,
            phone: existingUser.phone,
            verified: existingUser.verified,
            profilePic: existingUser.profilePic,
            role: existingUser.role
        },process.env.TOKEN_SECRET,
        {
            expiresIn: '8h',

        });

        res.cookie('Authorization', 
            `Bearer ${token}` ,
            {
                expires: new Date(Date.now() + 8 * 3600000),
                httpOnly: process.env.NODE_ENV === "production",
                secure: process.env.NODE_ENV === "production"
            }).status(200).json({
                success: true,
                token,
                message: "logged succesfully!"
            })
    }catch(err){
        console.log(err);
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({success: true, message :'logged out succesfully'});
}

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res.status(404).json({success:false, message: "User does not exist"});
        }

        if(existingUser.verified) {
            return res.status(400).json({success: false, message : "User already verified"});
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html: '<h1>' + codeValue + '<h1>',
        });

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success:true, message: "code sent!"})
        }

        return res.status(400).json({success:false, message: "code sent failed!"});
        }catch(err){
            console.log(err);
        }
}

exports.verifyVerificationCode = async (req, res) => {
    const { providedCode, email } = req.body;
    try{
        const { error, value } = acceptCodeSchema.validate({email, providedCode});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();

        const existingUser = await User.findOne({email}).select('+verificationCode +verificationCodeValidation');
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }

        if(existingUser.verified){
            return res.status(400).json({success: false, message: "you are already verified!"});
        }

        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(400).json({success: false, message: "something is wrong with the code!"});
        }

        if(Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) { //before 5 min
            return res.status(400).json({success: false, message: "code has been expired!"});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save()
            const token = jwt.sign({
                userId: existingUser._id,
                email: existingUser.email,
                username: existingUser.username,
                phone: existingUser.phone,
                verified: existingUser.verified,
                profilePic: existingUser.profilePic,
                role: existingUser.role
            },process.env.TOKEN_SECRET,
            {
                expiresIn: '8h',
    
            });
    
            return res.cookie('Authorization', 
                `Bearer ${token}` ,
                {
                    expires: new Date(Date.now() + 8 * 3600000),
                    httpOnly: process.env.NODE_ENV === "production",
                    secure: process.env.NODE_ENV === "production"
                }).status(200).json({
                    success: true,
                    token,
                    message: "logged succesfully!"
                })
        }

        return res.status(400).json({success: false, message: "unexpected has occured"});
    }catch(err){
        console.log(err);
    }
}

exports.changePassword = async (req, res) => {
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    try{
        const {error, value} = changePasswordSchema.validate({newPassword, oldPassword});
        if(error){
            res.status(410).json({success: false, message: error.details[0].message});
        }

        if(!verified){
            res.status(410).json({success: false, message: "You are not verified user!"});
        }
        const existingUser = await User.findOne({_id: userId}).select("+password");
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }

        const  result = await doHashValidator(oldPassword, existingUser.password);
        if(!result){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }

        const hashedPassword = await doHash(newPassword, 12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({success: true, message: "Password updated!"});
    }catch(error){
        console.log(error);
    }
}

exports.changeInformation = async (req, res) => {
    const { email, username } = req.body;
    const profilePic = req.file;
    const { userId } = req.user;
    
    try{
        const existingUser = await User.findOne({ _id: userId });
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exist!"});
        }
        if(email){
            const {error, value} = changeEmailSchema.validate({ email });
            if(error){
                return res.status(400).json({success: false, message: error.details[0].message})
            }
            existingUser.email = email;
        }
        if(username){
            existingUser.username = username;
        }
        if(profilePic){
            const url = await cloudinary.uploader.upload(profilePic.path, {
                folder: "profilePics",
                public_id: (username || existingUser.username || `user_${userId}`).replace(/\s+/g, "-").toLowerCase(), // optional custom name
                timeout: 60000  // timeout in milliseconds (60 seconds)
            });
    
            fs.unlink(profilePic.path, (err) => {
                if (err) console.error("Failed to delete local file:", err);
            });

            existingUser.profilePic = url.secure_url;
        }
        const data = await existingUser.save();
        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            username: existingUser.username,
            phone: existingUser.phone,
            verified: existingUser.verified,
            profilePic: existingUser.profilePic,
            role: existingUser.role
        },process.env.TOKEN_SECRET,
        {
            expiresIn: '8h',

        });

        return res.cookie('Authorization', 
            `Bearer ${token}` ,
            {
                expires: new Date(Date.now() + 8 * 3600000),
                httpOnly: process.env.NODE_ENV === "production",
                secure: process.env.NODE_ENV === "production"
            }).status(200).json({
                success: true,
                token,
                message: "changed succesfully!"
            })
    }catch(error){
        console.log(error);
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res.status(404).json({success:false, message: "User does not exist"});
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"Forgot Password code",
            html: `
                <header>
                    <h1>Forgot Password Code</h1>
                    <h1>${codeValue}</h1>
                </header>
            `,
        })
        
        if(info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success:true, message: "code sent!"})
        }

        return res.status(400).json({success:false, message: "code sent failed!"})
    }catch(err) {
        console.log(err);
    }
}

exports.verifyPasswordCode = async(req, res) => {
    const { email, providedCode, newPassword} = req.body;
    try{
        const { error, value } = accpetFPCodeSchema.validate({email, newPassword, providedCode});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();

        const existingUser = await User.findOne({email}).select('+forgotPasswordCode +forgotPasswordCodeValidation');
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }

        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            return res.status(400).json({success: false, message: "something is wrong with the code!"});
        }

        if(Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) { //before 5 min
            return res.status(400).json({success: false, message: "code has been expired!"});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        const hashedPassword = doHash(newPassword, 12);

        if(hashedCodeValue === existingUser.forgotPasswordCode){
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            existingUser.password = await hashedPassword;
            await existingUser.save()
            return res.status(200).json({success: true, message: "Password updated!"})
        }

        return res.status(400).json({success: false, message: "unexpected has occured"});

    }catch(err){
        console.log(err);
    }
}

exports.checkAuth = async (req, res) => {
    try {
      const authHeader = req.headers.cookie;
      
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
  
      const cookieValue = authHeader.split('Authorization=')[1];
      if (!cookieValue) {
        return res.status(401).json({ success: false, message: 'Invalid cookie format' });
      }
  
      const token = decodeURIComponent(cookieValue).replace('Bearer ', '');
      
      const user = jwt.verify(token, process.env.TOKEN_SECRET)
        
      return res.status(200).json({ 
        success: true, 
        user: { email: user.email, username: user.username, profilePic: user.profilePic, phone: user.phone, role: user.role },
        message: 'Authenticated' 
    });
    
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

exports.getAllUsers = async (req, res) => {
    const { page } = req.query;
        const usersPerPage = 9;
    
        try{
            let pageNum = 0;
            if(page >= 1){
                pageNum = page - 1;
            }else{
                pageNum = 0;
            }
    
            const result = await User.find().sort({ createdAt: -1 }).skip(pageNum * usersPerPage).limit(usersPerPage);

            res.status(200).json({ success: true, message: 'users', data: result });
        }catch(err){
            console.log(err);
        }
}

exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    const { _id } = req.query;
    try{
        if(!["admin", "user"].includes(role)){
            res.status(400).json({ success: false, message : "choose admin or user !" });
        }

        const existingUser = await User.findOne({ _id });
        if(!existingUser){
            return res.status(400).json({success:false, message: 'user does not exist'});
        }

        existingUser.role = role;
        result = await existingUser.save();
        
        res.status(200).json({ success: true, message: 'user updated!', data: result });

    }catch(err){
        console.log(err);
    }
}