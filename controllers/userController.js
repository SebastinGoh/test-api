// Get database schema modals
const User = require('../models/userSchema');

// Get utility functions
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

// Get external libraries
const crypto = require('crypto');

// Create new user (POST)
// /api/v1/user/
exports.createUser = catchAsyncErrors( async (req, res, next) => {
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

// Read user details (GET)
// /api/v1/user/
exports.getUser = catchAsyncErrors( async (req, res, next) => {
   
    const user = await User.findById(req.user.id)
        .populate({
            path : 'jobsPublished',
            select : 'title postingDate'
        });

    res.status(200).json({
        success : true,
        data : user
    });
});

// Update user name or email (PUT)
// /api/v1/user/
exports.updateUser = catchAsyncErrors( async(req, res, next) => {
    
    const newUserData = {
        name : req.body.name,
        email : req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new : true,
        runValidators : true,
        useFindAndModify : false
    })

    res.status(200).json({
        success : true,
        data : user
    });
});

// Delete current user account (DELETE)
// /api/v1/user/
exports.deleteUser = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.user.id);

    res.cookie('token', 'none', {
        expires : new Date(Date.now()),
        httpOnly : true
    });

    res.status(200).json({
        success : true,
        message : 'Your account has been deleted'
    })
});

// Try to login using user input (POST)
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

// Logout user (GET)
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

// Update user password
// /api/v1/user/password/update
exports.updatePassword = catchAsyncErrors( async(req, res, next) => {
    
    const user = await User.findById(req.user.id).select('+password');

    const doPasswordsMatch = await user.comparePasswords(req.body.oldPassword)
    if (!doPasswordsMatch) {
        return next(new ErrorHandler('Error: Invalid old password', 401));
    }

    // Setup new password
    user.password = req.body.newPassword;
    await user.save();

    sendToken(user, 200, res);
});

// User forgot password
// /api/v1/user/password/forgot
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
        // if error, reset password token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave : false });

        return next(new ErrorHandler("Error: Issue resetting password"), 500);
    }
});

// Reset password link
// /api/v1/user/password/reset/:token
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

    // Setup new password and reset password token
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res);
});