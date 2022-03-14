const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
exports.getOverview = catchAsync(async(req, res) => {
    // 1) get tour data from collections
    const tours = await Tour.find();
    // 2) build templated
    // 3) Render that template using tour data from step 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});
exports.getTour = catchAsync(async(req, res, next) => {
    // 1) get the tour and populate the guids and the the reviews
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug: slug }).populate({
        path: 'reviews',
        select: 'review rating user'
    });
    if (!tour) {
        return next(new AppError('NO tour found with that name', 404));
    }
    res.status(200)
        .set('Cross-Origin-Resource-Policy', 'cross-origin')
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour
        });
});
exports.getLoginForm = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('login', {
            title: `Login`
        });
};
exports.getAccount = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('account', {
            title: `Your Account`
        });
};

exports.updateUserData = catchAsync(async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, {
            name: req.body.name,
            email: req.body.email
        }, {
            new: true,
            runValidators: true
        }
    );

    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('account', {
            title: 'Your account',
            user: updatedUser
        });
});