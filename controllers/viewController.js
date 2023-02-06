const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

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

exports.getMyTours = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    const toursId = bookings.map((booking) => booking.tour);
    const tours = await Tour.find({ _id: { $in: toursId } });

    res.status(200).render('overview', {
      title: 'My bookings',
      tours,
    });
  } catch (error) {
    next(error);
  }
};

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert = 'Booking successful! Reload the page!';

  next();
};
