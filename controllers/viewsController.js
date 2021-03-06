const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === 'booking')
        res.locals.alert =
            "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up immediately, please come back later.";
    next();
};

exports.getSignupForm = (req, res, next) => {
    res.status(200).render('signup', {
        title: 'Signup'
    });
};

exports.getLoginForm = (req, res, next) => {
    res.status(200).render('login', {
        title: 'Login'
    });
};

exports.getForgotPasswordForm = (req, res, next) => {
    res.status(200).render('forgotPassword', {
        title: 'Forgot Password'
    });
}

exports.getResetPasswordForm = (req, res, next) => {
    const token = req.params.token;

    res.status(200).render('resetPassword', {
        title: 'Password Reset',
        token
    });
}

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template
    // See overview.pug file

    // 3) Render template using tour data from 1)
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get data from requested tour including guides and reviews
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    const booking = await Booking.find({ tour: tour.id, user: res.locals.user });
    const hasBooked = booking.length > 0 ? true : false

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }

    // 2) Build template
    // See tour.pug file

    // 3) Render template using tour data from 1)
    res.status(200)
        // This seems to be a workaround as Helmet settings are throwing an error
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com https://*.stripe.com; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://*.stripe.com/ 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
        )
        .render('tour', {
            title: `${tour.name} tour`,
            tour,
            hasBooked
        });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with returned Ids
    const tourIds = bookings.map((el) => el.tour);
    // Select all the tours that have an Id that is in the 'tourIds' array
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
        title: 'My tours',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            // The fields we want to update based on the 'name' attributes added to input fields on form
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true, // Get the new updated document as the result
            runValidators: true
        }
    );
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
    const userId = res.locals.user.id;

    // 1) Find all tours and reviews for logged in user
    const reviews = await Review.find({ user: userId });

    // 2) Create array of tourIds the user has reviewed
    const tourIds = reviews.map((el) => el.tour);

    // 3) Retrieve the tour information for reviewed tours
    const tours = await Tour.find({ _id: tourIds }).populate({
        path: 'reviews'
    });

    tours.forEach((el) => {
        let i = 0;
        for (i = 0; i < el.reviews.length; i += 1)
            if (el.reviews[i].user.id === userId) {
                el.reviews = el.reviews[i];
                return el.reviews;
            }
    });

    res.status(200).render('reviews', {
        title: 'My reviews',
        reviews,
        tours
    });
});
