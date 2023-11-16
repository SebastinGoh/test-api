const express = require('express');
const router = express.Router();

// Import controllers
const {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/userController');

// Import user login checking function
const { isUserAuthenticated } = require('../middleware/auth');

// Set up routing for general user CRUD and login/logout
router.route('/user/create').post(createUser);
router.route('/user/get').get(isUserAuthenticated, getUser);
router.route('/user/update').put(isUserAuthenticated, updateUser);
router.route('/user/delete').delete(isUserAuthenticated, deleteUser);
router.route('/user/login').post(loginUser);
router.route('/user/logout').get(isUserAuthenticated, logoutUser);

// Set up routing for user password reset/update
router.route('/user/password/forgot').post(forgotPassword);
router.route('/user/password/reset/:token').put(resetPassword);
router.route('/user/password/update').put(isUserAuthenticated, updatePassword);

module.exports = router;