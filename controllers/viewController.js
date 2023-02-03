const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');

exports.getOverview = async (req, res) => {
  try {
    const tours = await Tour.find();

    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour) return next(new AppError('Tour not found with this name!', 404));

    res.status(200).render('tour', {
      title: `${tour.name}`,
      tour,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSignupPage = async (req, res, next) => {
  try {
    res.status(200).render('signup', {
      title: 'Signup your account',
    });
  } catch (error) {
    next(error);
  }
};

exports.getLoginPage = async (req, res, next) => {
  try {
    res.status(200).render('login', {
      title: 'Log into your account',
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).render('account', {
      title: 'Your account',
    });
  } catch (error) {
    next(error);
  }
};