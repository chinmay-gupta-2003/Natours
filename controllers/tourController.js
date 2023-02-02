const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.aliasTopTours = (req, _, next) => {
  req.query = Object.assign(req.query, {
    limit: '5',
    sort: '-rating,price',
    fields: 'name,difficulty,price,rating,duration',
  });

  next();
};

exports.getTour = getOne(Tour, { path: 'reviews' });
exports.getAllTours = getAll(Tour);
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.getToursStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $group: {
          // _id: '$difficulty',
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          avgPrice: {
            $avg: '$price',
          },
          numRating: { $sum: '$ratingsQuantity' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      results: stats.length,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = +req.params.year;

    const monthlyPlan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          name: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { month: 1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: { monthlyPlan },
    });
  } catch (error) {
    next(error);
  }
};

exports.getToursWithinRange = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [latitude, longitude] = latlng.split(',');

    let radius;
    if (unit === 'mi') radius = distance / 3963.2;
    else if (unit === 'km') radius = distance / 6378.1;
    else return next(new AppError('Provide a valid unit', 400));

    if (!latitude || !longitude)
      return next(
        new AppError(
          'Please provide the latitude and longitude in the given format lat,lng',
          400
        )
      );

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius],
        },
      },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.calcDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [latitude, longitude] = latlng.split(',');

    let multiplier;
    if (unit === 'mi') multiplier = 0.000621371;
    else if (unit === 'km') radius = 0.001;
    else return next(new AppError('Provide a valid unit', 400));

    if (!latitude || !longitude)
      return next(
        new AppError(
          'Please provide the latitude and longitude in the given format lat,lng',
          400
        )
      );

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [+longitude, +latitude],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          name: 1,
          distance: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (error) {
    next(error);
  }
};
