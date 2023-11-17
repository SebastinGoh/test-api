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
    updatePassword,
    forgotPassword,
    resetPassword,
    adminDeleteUser
} = require('../controllers/userController');

// Import user login checking function
const { isUserAuthenticated } = require('../middleware/auth');

// Set up routing for general user CRUD and login/logout
router.route('/user/')
    .post(createUser)
    .get(isUserAuthenticated, getUser)
    .put(isUserAuthenticated, updateUser)
router.route('/user/:id')
    .delete(isUserAuthenticated, deleteUser);
router.route('/user/login').post(loginUser);
router.route('/user/logout').get(isUserAuthenticated, logoutUser);

// Set up routing for user password reset/update
router.route('/user/password/update').put(isUserAuthenticated, updatePassword);
router.route('/user/password/forgot').post(forgotPassword);
router.route('/user/password/reset/:token').put(resetPassword);

module.exports = router;