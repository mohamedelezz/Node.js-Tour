const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A Review Must Have a review']
    },
    rating: {
        type: Number,
        default: 4,
        min: [1, 'Rating Must be Greater than or equal to 1'],
        max: [5, 'Rating Must be Less than or equal to 5']
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review Must Belong To a Tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review Must Belong To a User']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// this compound index make the user and tour unique so the user can only make one unique review for the tour that's why we set the unique value to true
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function(next) {
    //^find > any query that has find (find, findOne,findOneAndUpdate....)
    /* This Refer to current Query */
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    // populate({
    //     path: 'tour',
    //     select: 'name'
    // });
    next();
});
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // tour is the tour id to whcih this review is related to
    // this here refer to the current model , and aggregate method works on the model Tour.aggregate> that's why we used static method on the model
    const stats = await this.aggregate([{
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantitiy: stats[0].nRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantitiy: 0
        });
    }
};
// we use post not pre because on presave the current review is not in the collection yet.
// focus ( post does not have access to next)
reviewSchema.post('save', async function() {
    //this point to the current document
    //construcctor is the model who created that document
    /* this.constructor refer to the current model */
    this.constructor.calcAverageRatings(this.tour);
});
/* We Want to use  calcAverageRatings on updating or deleting document*/
// the problem: this here refer to the current query, but we want to get access to the current review document
reviewSchema.pre(/^findOneAnd/, async function(next) {
    // we save r (which is the current review document to the query so that we can pass it to the post middleware function (to get access to the document))
    this.r = await this.findOne();
    next();
});
reviewSchema.post(/^findOneAnd/, async function() {
    // we couldn't perform the this.r = await this.findOne(); because at the post('find') the query has already been executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;