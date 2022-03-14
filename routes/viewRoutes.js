const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('../controllers/authenticationController');

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/submit-user-data', viewsController.updateUserData);

module.exports = router;