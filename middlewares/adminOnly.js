const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.adminCheck = async (req, res, next) => {
    let token;
    if(req.headers.client === 'not-browser'){
        token = req.headers.authorization;
    }else{
        token = req.cookies['Authorization'];
    }

    if(!token){
        return res.status(403).json({success: false, message: "Unauthorized"});
    }

    try{
            const adminToken = token.split(' ')[1];
            const jwtVerified = jwt.verify(adminToken, process.env.TOKEN_SECRET);
            if(jwtVerified.role === "admin"){
                req.user = jwtVerified;
                next();
            }else{
                throw new Error('error in the token');
            }
        }catch(err){
            console.log(err);
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
}