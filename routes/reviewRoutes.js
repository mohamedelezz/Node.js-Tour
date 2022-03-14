const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authenticationController');
// param middleware
// router.param('id', reviewController.checkId);
router.use(authController.protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );
router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(
        catchAsync(async(req, res, next) => {
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
    )
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    );
module.exports = router;