const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');

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

      success_url: `${req.protocol}://${req.get('host')}/my-bookings`,

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

              images: [
                `${req.protocol}://${req.get('host')}/img/tours/${
                  tour.imageCover
                }`,
              ],
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

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.createBooking = createOne(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
