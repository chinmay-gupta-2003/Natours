const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourAndUserIDs,
  getReview,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

// Using protect as a middleware
router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user', 'admin'), setTourAndUserIDs, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('admin'), deleteReview);

module.exports = router;
