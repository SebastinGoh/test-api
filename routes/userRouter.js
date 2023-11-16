const express = require('express');
const router = express.Router();

// Import controllers
const {
    createNewUser,
    loginUser,
    forgotPassword,
    resetPassword
} = require('../controllers/userController');

// Set up routing for requests to be handled by controller
router.route('/user/create').post(createNewUser);
router.route('/user/login').post(loginUser);

router.route('/user/forgot').post(forgotPassword);
router.route('/user/reset/:token').put(resetPassword);

module.exports = router;