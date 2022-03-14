const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    // Object.keys(obj) return an array containing all the names of the object elements
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
// update me is for the currently authenticated user but the updateUser for the admin to update the user
exports.updateMe = catchAsync(async(req, res, next) => {
    // 1) Create Error if user posts password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password update, please use /updateMyPassword to update',
                400
            )
        );
    }
    // body.role = 'admin' > we should't allow that so we only need to filter the body to conain only name and email but nothing else

    // 2) filter out unwanted field names  that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody, {
            new: true,
            runValidators: true
        }
    );

    // 3)update the user document
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});
// delete me is for the currently authenticated user but the deleteUser for the admin to delete the user
exports.deleteMe = catchAsync(async(req, res, next) => {
    // 1)update the user document to in active

    await User.findByIdAndUpdate(req.user.id, {
        active: false
    });
    // 1)send 204 response

    res.status(204).json({
        // 204: user deleted no response  but below is just good practice
        status: 'success',
        data: null
    });
});
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Please use /signup instead.'
    });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//  Focus (Don't Update Password with this because in the update function we use findByIdAndUpdate and in it all pre('save') functions don't work so password updating won't work
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);