const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');

exports.getCheckoutSession = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      success_url: `${req.protocol}://${req.get('host')}/`,

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
