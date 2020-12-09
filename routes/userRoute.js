const express = require('express');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/isLoggedIn').get(authController.isLoggedIn);
router.route('/logout').get(authController.logout);
router.route('/updatePassword').post(authController.protect, authController.updatePassword);


router.route('/forgotPassword').post(authController.forgotePassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

module.exports = router;