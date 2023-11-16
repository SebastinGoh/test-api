// Get database schema modals
const User = require('../models/userSchema');

// Get utility functions
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const APIFilter = require('../utils/filterHandler');
const sendToken = require('../utils/jwtToken');

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
        return next(new ErrorHandler("Please provide email and password"), 400)
    }

    try {
        const user = await User.findOne({email}).select('+password');
        const isPasswordCorrect = await user.comparePasswords(password);
        if (!isPasswordCorrect) {
            return next(new ErrorHandler("Invalid password"), 401);
        }

         // Create and store JSON Web Token
        sendToken(user, 200, res);

    } catch (e) {
        return next(new ErrorHandler("Invalid email"), 401);
    }
});