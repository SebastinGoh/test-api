const express = require('express');
const router = express.Router();

// Import controllers
const {
    createNewUser,
    getUser,
    loginUser,
    forgotPassword,
    resetPassword,
    logoutUser
} = require('../controllers/userController');

// Import authentication check
const { isUserAuthenticated } = require('../middleware/auth');

// Set up routing for requests to be handled by controller
router.route('/user/create').post(createNewUser);
router.route('/user/get').get(isUserAuthenticated, getUser);
router.route('/user/login').post(loginUser);

router.route('/user/forgot').post(forgotPassword);
router.route('/user/reset/:token').put(resetPassword);
router.route('/user/logout').get(isUserAuthenticated, logoutUser);

module.exports = router;