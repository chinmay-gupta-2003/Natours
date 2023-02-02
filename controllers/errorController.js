const appError = require('../utils/appError');

const castErrorHandlerDB = (errProd) => {
  const message = `Invalid ${errProd.path} : ${errProd.value}`;

  return new appError(message, 400);
};

const duplicateNameHandlerDB = (errProd) => {
  const message = `Tour name: (${errProd.keyValue.name}) should be unique. Another tour exists with the same name.`;

  return new appError(message, 400);
};

const validationErrorHandlerDB = (errProd) => {
  const errMsgStr = Object.values(errProd.errors).map((err) => err.message);
  const message = errMsgStr.join('. ');

  return new appError(message, 400);
};

const JWTErrorHandler = (errProd) => {
  const message = 'Invalid token recieved! Please login again';

  return new appError(message, 401);
};

const JWTExpiredTokenHandler = (errProd) => {
  const message = 'Your token is expired! Please login again';

  return new appError(message, 401);
};

const sendErrProd = (err, req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.operationalError) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('Error', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  } else {
    if (err.operationalError) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        message: err.message,
      });
    } else {
      console.error('Error', err);
      res.status(500).render('error', {
        title: 'Something went wrong',
        message: 'Please try again later',
      });
    }
  }
};

const sendErrDev = (err, req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    console.log('Error: ', err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
};

exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let errProd = Object.assign(err);

    if (errProd.name === 'CastError') errProd = castErrorHandlerDB(errProd);
    if (errProd.code === 11000) errProd = duplicateNameHandlerDB(errProd);
    if (errProd.name === 'ValidationError')
      errProd = validationErrorHandlerDB(errProd);

    if (errProd.name === 'JsonWebTokenError')
      errProd = JWTErrorHandler(errProd);
    if (errProd.name === 'TokenExpiredError')
      errProd = JWTExpiredTokenHandler(errProd);

    sendErrProd(errProd, req, res);
  }

  next();
};
