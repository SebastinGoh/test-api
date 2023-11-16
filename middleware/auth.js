const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

// Check if the user is logged in or not
exports.isUserAuthenticated = catchAsyncErrors( async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorHandler('User needs to be login to do this', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    next();
})

exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed to do this`, 403))
        }
        next();
    }
}