const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const {
  createOne,
  getOne,
  getAll,
  deleteOne,
  updateOne,
} = require('../controllers/handlerFactory');

exports.getCheckoutSession = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      success_url: `${req.protocol}://${req.get('host')}/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,

      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

      customer_email: req.user.email,
      client_reference_id: req.params.tourId,

      line_items: [
        {
          quantity: 1,

          price_data: {
            currency: 'inr',
            unit_amount: tour.price * 100,

            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,

              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
        },
      ],

      mode: 'payment',
    });

    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBookingCheckout = async (req, res, next) => {
  try {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);

    next();
  } catch (error) {
    next(error);
  }
};

exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.createBooking = createOne(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
