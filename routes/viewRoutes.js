const express = require('express');

const {
  getOverview,
  getTour,
  getLoginPage,
  getSignupPage,
  getMe,
} = require('../controllers/viewController');

const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

router.route('/').get(createBookingCheckout, isLoggedIn, getOverview);
router.route('/tour/:slug').get(isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLoginPage);
router.route('/signup').get(isLoggedIn, getSignupPage);

router.route('/me').get(protect, getMe);

module.exports = router;
