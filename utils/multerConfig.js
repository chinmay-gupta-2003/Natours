const multer = require('multer');
const sharp = require('sharp');

const AppError = require('./appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) callback(null, true);
  else callback(new AppError('Only image uploads are permitted!', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 6 * 1024 * 1024 },
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.uploadTourPhoto = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'image',
    maxCount: 3,
  },
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files) return next();

  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  if (req.files.image) {
    req.body.images = [];

    await Promise.all(
      req.files.image.map(async (file, index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${
          index + 1
        }.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }
  next();
};
