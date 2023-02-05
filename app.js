const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const appError = require('./utils/appError');
const { errorHandler } = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
const api = '/api/v1';

// MIDDLEWARES

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// app.use(helmet());
// app.use(cors());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too may requests from the same IP, please try again in an hour!',
});

app.use('/api', limiter);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(sanitize());
app.use(xss());

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

// ROUTES

app.use('/', viewRouter);

app.use(`${api}/tours`, tourRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/reviews`, reviewRouter);
app.use(`${api}/bookings`, bookingRouter);

app.all('*', (req, res, next) => {
  next(new appError(`Unable to query ${req.originalUrl}`, 404));
});

app.use(errorHandler);

module.exports = app;
