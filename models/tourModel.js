/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');
const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour Must Have a Name'],
            unique: true,
            trim: true,
            maxLength: [40, 'A Tour name must be less or equal characters'],
            minLength: [10, 'A Tour name must be greater or equal characters']
            // validate: [
            //     validator.isAlpha,
            //     'Tour Name Must Only Contain Characters'
            // ]
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour Must Have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a Group Size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['difficult', 'easy', 'medium'],
                message: 'Difficulty is either difficult, easy , or medium'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4,
            min: [1, 'Rating Must be Greater than or equal to 1'],
            max: [5, 'Rating Must be Less than or equal to 5'],
            set: (val) => Math.round(val * 10) / 10
        },
        ratingsQuantitiy: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour Must Have a Price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                message:
                    'Discount Price ({VALUE}) Cannot Be Greater than price',
                validator: function (value) {
                    // this only points to current doc on new document creation not update!!!
                    return value < this.price;
                }
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour Must Have a Summary']
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour Must Have a Cover Image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        // guides: Array (Embedding guides instead of referencing)
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);
// single index
// tourSchema.index({ price: 1});

// Compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// Importsnt !! inorder to be able to make geospacial queries.we need to make index to the field where geospacial data we are searching for is stored
tourSchema.index({ startLocation: '2dsphere' }); //we tell mongodb to startlocation should be indexed to a 2d sphere
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

/***************Virtual populate reviews in the tour schema ***********/
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});
// mongoose Middleware types: 1) document 2)query 3)aggregate 4) model

/********* 1) Document MiddleWare runs before .save() .create() *********/
tourSchema.pre('save', function (next) {
    /* This Refer to current Document */
    this.slug = slugify(this.name, { lower: true });
    next();
});
/****************** (Test) Embedding guides instead of referencing ***********/
// tourSchema.pre('save', async function(next) {
// 	/* Embedding Document using di !!!! ONly works for saving or creating document not updating*/
//     /* we want to change the guides array of ids into collections of guides itself (embedded)*/
//     const guidesPromises = this.guides.map(
//         async(el) => await User.findById(el)
//     );
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });
/***************************End of Embedding guides instead of referencing******************************* */
// tourSchema.pre('save', function(next) {
//     console.log(this);
//     next();
// });
// tourSchema.post('save', function(doc, next) {
//     this.slug = slugify(this.name, { lower: true });
//     console.log(doc);
//     next();
// });

/******************  2) Query Middleware ****************/
tourSchema.pre(/^find/, function (next) {
    //^find > any query that has find (find, findOne,findOneAndUpdate....)
    /* This Refer to current Query */
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});
tourSchema.pre(/^find/, function (next) {
    //^find > any query that has find (find, findOne,findOneAndUpdate....)
    /* This Refer to current Query */
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});
tourSchema.post(/^find/, function (docs, next) {
    //^find > any query that has find (find, findOne,findOneAndUpdate....)
    console.log(`Query Took ${Date.now() - this.start} milliSeconds`);
    // console.log(docs);
    next();
});

/******************  3) Aggregation Middleware ****************/
// focus if there is geonear calculatino to calculate the distances you have to check first for it here because geonear needt to always be the first pipeline
// tourSchema.pre('aggregate', function(next) {
//     /* This Refer to current document that has pipeline */
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//     next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
