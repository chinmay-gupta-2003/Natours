const express = require('express');

const {
  getOverview,
  getTour,
  getLoginPage,
  getSignupPage,
  getMe,
  getMyTours,
} = require('../controllers/viewController');

const { isLoggedIn, protect } = require('../controllers/authController');

const router = express.Router();

router.route('/').get(isLoggedIn, getOverview);
router.route('/tour/:slug').get(isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLoginPage);
router.route('/signup').get(isLoggedIn, getSignupPage);

router.route('/me').get(protect, getMe);
router.route('/my-bookings').get(protect, getMyTours);

module.exports = router;
