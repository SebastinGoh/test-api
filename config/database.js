const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI

const connectDatabase = () => {
    mongoose.connect(MONGODB_URI).then(con => {
        console.log(`Connected to MongoDB with host: ${con.connection.host}`);
    });
};

module.exports = connectDatabase;