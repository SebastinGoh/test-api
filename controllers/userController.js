// Get database schema modals
const User = require('../models/userSchema');
const Job = require('../models/jobSchema');

// Get utility functions
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const APIFilter = require('../utils/filterHandler');

// Get external libraries
const crypto = require('crypto');
const fs = require('fs');

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

    if (req.user.role === "admin") {
        // Get details with all published jobs for admin
        const user = await User.findById(req.user.id)
            .populate({
                path : 'jobsPublished',
                select : 'title postingDate'
            });
        
        let users;
        if (req.query) {
            const apiFilter = new APIFilter(User.find(), req.query)
                .filter()
                .limitFields();
            users = await apiFilter.query;
        } else {
            users = await User.find();
        }
        user.users = users;

        res.status(200).json({
            success : true,
            data : user
        });
    } else if (req.user.role === "employer") {
        // Get details with all published jobs for employers
        const user = await User.findById(req.user.id)
            .populate({
                path : 'jobsPublished',
                select : 'title postingDate'
            });

        res.status(200).json({
            success : true,
            data : user
        });
    } else {
        // Get details with all applied jobs for users
        const user = await User.findById(req.user.id)
        .populate({
            path : 'jobsApplied',
            select : 'id'
        });

        res.status(200).json({
            success : true,
            data : user
        });
    }
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
// /api/v1/user/:id
exports.deleteUser = catchAsyncErrors( async (req, res, next) => {
    
    const user = await User.findById(req.user.id);
    console.log(`Req ID: ${req.params.id}`);
    console.log(`Role: ${user.role}`);

    let userToDelete;
    // If 'admin' role and specified a user id
    if (user.role === "admin" && req.params.id) {
        // try to set account to delete as specified
        userToDelete = await User.findById(req.params.id)

        if (!user) {
            return next(new ErrorHandler(`Error: Invalid user id ${req.params.id}`, 404));
        }
    } else {
        userToDelete = req.user.id;
    }

    userToDelete = await User.findByIdAndDelete(userToDelete.id);

    // Delete user data based on role
    switch (userToDelete.role) {
        // Delete all jobs published by employer
        case "employer":
            await Job.deleteMany({ user : userToDelete });
        break;

        // Delete all applied jobs and resumes by user
        case "user":
            const appliedJobs = await Job.find({'applicantsApplied.id' : userToDelete }).select('+applicantsApplied');

            for (let i=0; i < appliedJobs.length; i++) {
                let obj = appliedJobs[i].applicantsApplied.find( o => o.id === userToDelete);

                let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace('\\controllers', '');

                fs.unlink(filepath, err => {
                    if (err) return next(new ErrorHandler("Error: Issue deleting file"), 500);
                });

                appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id));

                appliedJobs[i].save();
            }
        break;
    }
    
    // if current user deleted their own account
    if (userToDelete === user) {
        res.cookie('token', 'none', {
            expires : new Date(Date.now()),
            httpOnly : true
        });
    }

    res.status(200).json({
        success : true,
        message : 'The account has been deleted'
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