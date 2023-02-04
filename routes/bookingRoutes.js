const express = require('express');

const { protect } = require('../controllers/authController');

const { getCheckoutSession } = require('../controllers/bookingController');

const router = express.Router();

router.route('/checkout-session/:tourId').get(protect, getCheckoutSession);

module.exports = router;
