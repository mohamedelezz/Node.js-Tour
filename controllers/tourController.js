/* eslint-disable prettier/prettier */
const app = require('../app');
const Tour = require('../models/tourModel');
const AppError = require('./../utils/AppError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
// param middle ware
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary';
    next();
};
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async(req, res, next) => {
    const stats = await Tour.aggregate([{
            $match: { ratingsAverage: { $gte: 2 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsAverage' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        // }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([{
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStart: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStart: -1 }
        },
        {
            $limit: 12
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});
// /tours-within/:distance/center/:latlong/unit/:unit
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    // to get the radius in radians we divide the distance by the radius of the earth
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if ((!lat, !lng)) {
        return next(
            new AppError(
                'please provide latitude and longitude in the format lat,long',
                400
            )
        );
    }
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [
                    [lng, lat], radius
                ] } }
    });
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});
// /distances/:latlng/unit/:unit
exports.getDistances = catchAsync(async(req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    // to get the radius in radians we divide the distance by the radius of the earth
    if ((!lat, !lng)) {
        return next(
            new AppError(
                'please provide latitude and longitude in the format lat,long',
                400
            )
        );
    }
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
        //geoNear pipeline is used to calculate distances between geo points and has to be always the first pipeline !!!! and require one of our fields to have geospacial index
        // Note: if you have only one geospacial field u don't need ot specify the key< if more , you have to specify the key that you want to perform the calculations on
        {
            // near is the point from where you want to calculate the distances, need to be geojson
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                // distanceMultiplier is the number that is going to be multiplied by all the distances
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            distances
        }
    });
});

// exports.getAllTours = catchAsync(async(req, res, next) => {
//     // Build The Query
//     // //1A) filtering
//     // const queryObj = {...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // excludedFields.forEach((field) => delete queryObj[field]);
//     // // const query = await Tour.find()
//     // //     .where('difficulty')
//     // //     .equals('easy')
//     // //     .where('duration')
//     // //     .equals(5);

//     // // 1B) advanced filtering
//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(
//     //     /\b(gte|gt|lte|lt)\b/g,
//     //     (match) => `$${match}`
//     // );
//     // let query = Tour.find(JSON.parse(queryStr));

//     //2) Sorting
//     // if (req.query.sort) {
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     query = query.sort(sortBy);
//     // } else {
//     //     query = query.sort('-price');
//     // }
//     //3) Field Limiting
//     // if (req.query.fields) {
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // } else {
//     //     query = query.select('-__v');
//     // }

//     //4) paginations
//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;
//     // query = query.skip(skip).limit(limit);
//     // if (req.query.page) {
//     //     const numTours = await Tour.countDocuments();
//     //     if (skip >= numTours) throw new Error('This Page Does not exist');
//     // }
//     // excute the query object
//     const features = new ApiFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//     const tours = await features.query;
//     //send response
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
// });
// exports.deleteTour = catchAsync(async(req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//         return next(new AppError('No Tour Found With That id', 404));
//     }

//     res.status(204).json({
//         //204 conent deleted
//         status: 'success',
//         data: null
//     });
// });