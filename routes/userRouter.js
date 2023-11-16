const express = require('express');
const router = express.Router();

// Import controllers
const {
    createNewUser,
    getUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/userController');

// Import authentication check
const { isUserAuthenticated } = require('../middleware/auth');

// Set up routing for requests to be handled by controller
router.route('/user/create').post(createNewUser);
router.route('/user/get').get(isUserAuthenticated, getUser);
router.route('/user/login').post(loginUser);
router.route('/user/logout').get(isUserAuthenticated, logoutUser);

router.route('/user/password/forgot').post(forgotPassword);
router.route('/user/password/reset/:token').put(resetPassword);
router.route('/user/password/update').put(isUserAuthenticated, updatePassword);

module.exports = router;