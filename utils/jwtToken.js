// Create and send token and save in cookie
const sendToken = (user, statusCode, res) => {
    // Create token
    const token = user.getJwtToken(); 

    // Options for cookie
    const Options = {
        // Setting expiry time for JWT_EXPIRES_TIME * 1 day (7 days)
        expires : new Date(Date.now() + process.env.TOKEN_EXPIRES_TIME * 24*60*60*1000),
        httpOnly : true
    };

    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    };

    res
        .status(statusCode)
        .cookie('token', token, Options)
        .json({
            success : true,
            token
        });
}

module.exports = sendToken;