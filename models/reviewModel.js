const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review field should not be empty!'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating!'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must wrriten by a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numberOfRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numberOfRatings,
      ratingsAverage: Math.round(stats[0].averageRating * 10) / 10,
    });
  else
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
};

reviewSchema.index(
  { user: 1, tour: 1 },
  {
    unique: true,
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'user',
      select: 'name photo',
    },
  ]);

  next();
});

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (document) {
  await document.constructor.calcAverageRating(document.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
