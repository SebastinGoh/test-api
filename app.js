// Import external utilities
const express = require('express');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');

// Handle Error: Shut down server due to uncaught exceptions
process.on('uncaughtException', err => {
    console.log(`Error: ${err.stack}`);
    console.log('Shutting down server due to uncaught exception');
    process.exit(1);
})

// Initiate NodeJS Express app
const app = express();
// Add Express JSON body parser to app 
app.use(express.json());
// Add cookie parser to app
app.use(cookieParser());
// Add handling of file upload to app
app.use(fileUpload());

// Set up config.env file variables
dotenv.config({path: './config/config.env'})
const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const API_VER = process.env.API_VER;

// Connect to database
const connectDatabase = require('./config/database');
connectDatabase();

// Import and add routers to app
const jobsRouter = require('./routes/jobsRouter');
app.use(`/api/${API_VER}`,jobsRouter);
const userRouter = require('./routes/userRouter');
app.use(`/api/${API_VER}`,userRouter);

// Handle Error: ErrorHandler due to unhandled routes
// Only do this after including router above for valid routes
const ErrorHandler = require('./utils/errorHandler');
app.all('*', (req, res, next) => {
    next(new ErrorHandler(`Error: ${req.originalUrl} route not found`, 404));
});

// Importing middleware
const errorMiddleware = require('./middleware/errors');
app.use(errorMiddleware);

// Initialise app server
const server = app.listen(PORT, ()=>{
    console.log(`Listening to PORT ${PORT} in ${NODE_ENV} mode`);
})

// Handle Error: Shut down server due to unhandled server setup rejection
process.on('unhandledRejection', err => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down server due to handled promise rejection');
    server.close(() => {
        process.exit(1);
    })
});