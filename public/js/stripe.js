import { showAlert } from './alert.js';

const stripe = Stripe(
  'pk_test_51MXn7lSDMVPHHluql5GF3iSV60l1FKHPvGnMTLxsYWcF7fsEE9GMSwtIqiU9OagNqTgCeoiVtwKe7j8zG5osFbum00XiUOy89W'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', err);
  }
};
