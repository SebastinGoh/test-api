const NODE_ENV = process.env.NODE_ENV;

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    switch (NODE_ENV) {
        case "development":
            res.status(err.statusCode).json({
                success : false,
                error : err,
                errMessage : err.message,
                stack : err.stack
            })
            break
        case "production":
            if (err.name === "JsonWebTokenError") {
                const message = 'JSON Web Token is invalid';
                error = new ErrorHandler(message, 500);
            }
            if (err.name === "TokenExpiredError") {
                const message = 'JSON Web Token has expired';
                error = new ErrorHandler(message, 500);
            }
            let error = {...error};

            error.message = err.message;

            res.status(err.statusCode).json({
                success : false,
                message : error.message || 'Internal Server Error'
            })
            
            break
    }
}