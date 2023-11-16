const express = require('express');
const router = express.Router();

// Import controllers
const {
    createNewUser,
    loginUser
} = require('../controllers/userController');

// Set up routing for requests to be handled by controller
router.route('/user/create').post(createNewUser);
router.route('/user/login').post(loginUser);

module.exports = router;