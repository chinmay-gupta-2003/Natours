const express = require('express');

const {
  signUp,
  logIn,
  forgetPassword,
  resetPassword,
  updatePassword,
  protect,
  deactivateUser,
  restrictTo,
  logout,
} = require('../controllers/authController');

const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserData,
  getMe,
} = require('../controllers/userController');

const { uploadUserPhoto, resizeUserImage } = require('../utils/multerConfig');

const router = express.Router();

router.route('/signup').post(signUp);
router.route('/login').post(logIn);
router.route('/logout').get(logout);
router.route('/forgetPassword').post(forgetPassword);
router.route('/resetPassword/:token').patch(resetPassword);

// Use protect as middleware
router.use(protect);

router.route('/updatePassword').patch(updatePassword);
router.route('/deactivateMe').patch(deactivateUser);
router
  .route('/updateMe')
  .patch(uploadUserPhoto, resizeUserImage, updateUserData);
router.route('/me').get(getMe, getUser);

router.route('/').get(restrictTo('admin'), getAllUsers).post(createUser);

router.use(restrictTo('admin'));

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
