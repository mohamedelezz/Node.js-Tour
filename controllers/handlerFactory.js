const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const ApiFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async(req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError(`No document Found With That id`, 404));
        }
        res.status(204).json({
            //204 conent deleted
            status: 'success',
            data: null
        });
    });
//  Focus (Don't Update Password with this because in the update function we use findByIdAndUpdate and in it all pre('save') functions don't work so password updating won't work
exports.updateOne = (Model) =>
    catchAsync(async(req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // send the newly updated tour to client
            runValidators: true
        });
        if (!doc) {
            return next(new AppError('No document Found With That id', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
exports.createOne = (Model) =>
    catchAsync(async(req, res, next) => {
        // console.log();
        const doc = await Model.create(req.body);
        res.status(201).json({
            // means data created successfully
            status: 'success',
            data: {
                data: doc
            }
        });
    });
exports.getOne = (Model, popOptions) =>
    catchAsync(async(req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);
        const doc = await query;
        if (!doc) {
            return next(new AppError('No doc Found With That id', 404)); //404 not found
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
exports.getAll = (Model, popOptions) =>
    catchAsync(async(req, res, next) => {
        // this only works on reviews to allow for nested get reviews on tour(hack)
        let filter = {};
        if (req.params.tourId) {
            filter = { tour: req.params.tourId };
        }
        const features = new ApiFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const doc = await features.query;
        //send response
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
        });
    });