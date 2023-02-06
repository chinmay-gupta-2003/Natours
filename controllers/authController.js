const { promisify } = require('util');
const User = require('../models/userModel');
const JWT = require('jsonwebtoken');
const appError = require('../utils/appError');
const Email = require('../utils/email');
const crypto = require('crypto');

const generateToken = (id) =>
  JWT.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (req, res, statusCode, user) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure,
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    newUser.password = undefined;

    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser, url).sendWelcome();

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new appError('Please provide email and passwords', 400));

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.checkPassword(password, user.password)))
      return next(new appError('Incorrect email or password', 401));

    createSendToken(req, res, 200, user);
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logged-out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.isLoggedIn = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      if (!token) return next();

      const verifyJWT = promisify(JWT.verify);
      const decodedJWT = await verifyJWT(token, process.env.JWT_SECRET);

      const currentUser = await User.findById(decodedJWT.id);

      if (!currentUser) return next();
      if (currentUser.checkPasswordChanges(decodedJWT.iat)) return next();

      res.locals.user = currentUser;

      return next();
    }

    next();
  } catch (error) {
    next();
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer'))
      token = authHeader.split(' ')[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token) return next(new appError('Unauthorised access, Please login!'));

    const verifyJWT = promisify(JWT.verify);

    const decodedJWT = await verifyJWT(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decodedJWT.id);
    if (!currentUser)
      return next(new appError('User not found with this token!', 401));

    if (currentUser.checkPasswordChanges(decodedJWT.iat))
      return next(new appError('Password changed recently, Login again!', 401));

    res.locals.user = currentUser;
    req.user = currentUser;

    next();
  } catch (error) {
    next(error);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new appError('You do not have permission for this action', 403)
      );

    next();
  };
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(
        new appError('User not found with the current email address', 404)
      );

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      const resetURL = `${req.protocol}//${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new appError(
          'There was error sending email, please try again later!',
          500
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashToken,
      resetPasswordTokenExpire: { $gt: Date.now() },
    });

    if (!user) return next(new appError('Token is invalid or expired', 400));

    if (!req.body.password || !req.body.confirmPassword)
      return next(new appError('Provide a new password and confirm it.', 400));

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;

    await user.save();

    createSendToken(req, res, 200, user);
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('+password');

    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword)
      return next(new appError('Enter all fields to update password!', 400));

    if (!(await user.checkPassword(currentPassword, user.password)))
      return next(new appError('Please enter a valid current password', 401));

    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    await user.save();

    createSendToken(req, res, 200, user);
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!req.body.password)
      return next(new appError('Please provide your password!', 400));

    if (!(await user.checkPassword(req.body.password, user.password)))
      return next(
        new appError('Incorrect password, re-enter the correct password!', 401)
      );

    user.active = false;
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
