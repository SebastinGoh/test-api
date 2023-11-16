// Get database schema modals
const User = require('../models/userSchema');

// Get utility functions
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const APIFilter = require('../utils/filterHandler');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

// Get external libraries
const crypto = require('crypto');

// Create new job
// /api/v1/user/create
exports.createNewUser = catchAsyncErrors( async (req, res, next) => {
    const { name, email, password, role } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    // Create and store JSON Web Token
    sendToken(user, 200, res);
});

// Try to post user input to login
// /api/v1/user/login
exports.loginUser = catchAsyncErrors( async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password ) {
        return next(new ErrorHandler("Error: Please provide email and password"), 400)
    }

    try {
        const user = await User.findOne({email}).select('+password');
        const isPasswordCorrect = await user.comparePasswords(password);
        if (!isPasswordCorrect) {
            return next(new ErrorHandler("Invalid email or password"), 401);
        }

         // Create and store JSON Web Token
        sendToken(user, 200, res);

    } catch (e) {
        return next(new ErrorHandler("Invalid email or password"), 401);
    }
});

// User forgot password
// /api/v1/user/forgot
exports.forgotPassword = catchAsyncErrors( async(req, res, next) => {
    const user = await User.findOne({ email : req.body.email });

    if (!user) {
        return next(new ErrorHandler("Error: No user found"), 404);
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave : false });

    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/${process.env.API_VER}/user/reset/${resetToken}`;

    const message = `
        Your password reset link is as follows: 
        \n\n
        ${resetUrl}
        \n\n
        If you did not request this, simply ignore this email.
    `
    
    try {
        await sendEmail({
            email : user.email,
            subject : 'Jobbee API - Password Reset Recovery',
            message
        });

        res.status(200).json({
            success : true,
            message : `Password recovery email sent to ${user.email}`
        });

    } catch(e) {

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave : false });

        return next(new ErrorHandler("Error: Issue resetting password"), 500);
    }
});

// Reset password link
// /api/v1/user/reset/:token
exports.resetPassword = catchAsyncErrors( async(req, res, next) => {
    // Hash url token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire : { $gt : Date.now()}
    });

    if (!user) {
        return next(new ErrorHandler('Error: Invalid password reset token', 400));
    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res);
});

// Logout user
// /api/v1/user/logout
exports.logoutUser = catchAsyncErrors( async(req, res, next) => {
    res.cookie('token', 'none', {
        expires : new Date(Date.now()),
        httpOnly : true
    });

    res.status(200).json({
        success : true,
        message : 'Successfully logged out'
    });
});