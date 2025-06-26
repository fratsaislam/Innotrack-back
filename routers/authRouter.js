const express = require("express");
const router = express.Router();

const upload = require("../middlewares/multer");

const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');
const { adminCheck} = require('../middlewares/adminOnly');

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);
router.patch('/send-verification-code', authController.sendVerificationCode);
router.patch('/verify-verification-code', authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);
router.patch('/send-forgot-password-code', authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', authController.verifyPasswordCode);
router.patch('/change-information', identifier, upload.single("profilePic"), authController.changeInformation);
router.get('/check', identifier, authController.checkAuth);
router.get('/all-users', adminCheck, authController.getAllUsers);
router.patch('/update-user-role', adminCheck, authController.updateUserRole);


module.exports = router;