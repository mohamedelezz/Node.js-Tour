const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    // allow nested route
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview =  catchAsync(async(req, res, next) => {
    const doc = await Review.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError(`No document Found With That id`, 404));
    }
    res.status(204).json({
        //204 conent deleted
        status: 'success',
        data: null
    });
});