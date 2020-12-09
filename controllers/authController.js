const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

function signToken(id){
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: false
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = false;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        login: req.body.login,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        email: req.body.email
    })

    createSendToken(newUser, 201, res);
})

exports.login = catchAsync( async (req, res, next) => {
    const { login, password } = req.body;

    if(!login || !password)
        return next(new AppError('Please provide valid email and password', 401));

    const user = await User.findOne({ login }).select('+password');
    if(!user || !(await user.checkPassword(password, user.password)))
        return next(new AppError("Please provide correct email or password !", 401))
    createSendToken(user, 200, res);
})

exports.logout = catchAsync(async (req, res, next) => {
    res.clearCookie('jwt');
    res.status(200).json({
        status: 'success'
    })
})

exports.protect = catchAsync( async ( req, res, next) => {
    //1) Check token and check if it's there
    const token = req.cookies.jwt;

    if(!token)
        return next(new AppError("User isn't logged in", 401 ))
    //2) Validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3) Check if user is exist

    const currentUser = await User.findById(decoded.id);

    //4) Check if user changed password after JWT wat issued

    if(!currentUser || await currentUser.changedPasswordAfter(decoded.iat))
        return next(new AppError('You have to relogin ', 404));

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
})

exports.isLoggedIn = catchAsync(async( req, res, next ) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 2) Check if user still exists

            const currentUser = await User.findById(decoded.id);

            // 3) Check if user changed password after the token was issued

            if(!currentUser || await currentUser.changedPasswordAfter(decoded.iat))
                return next(new AppError('You have to relogin ', 404));

            // THERE IS A LOGGED IN USER
            currentUser.passwordChangedAt = undefined;

            return res.status(200).json({
                status: "success",
                data: currentUser
            })

        } catch (err) {
            return next(new AppError('Something went wrong ', 404));
        }
    }

    //in case no / not valid token send null user

    return res.status(200).json({
        status: "success",
        data: null
    })
})

exports.forgotePassword = catchAsync(async(req, res, next) => {
    // 1) find User by id
    const user = await User.findOne({ email : req.body.email });

    if(!user)
        return next(new AppError("User not found with this email", 404))

    // 2) generate new token

    const token = await user.createUserResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) send email
    const resetUrl = `${req.protocol}://${req.get('host')}/users/resetPassword/${token}`;
    const message = `Forgot your password? Submit PATCH request with new password and passwordConfirm: ${resetUrl}.\n` +
        `If you didn't forget, please ignore this email.`

    try{
        await sendEmail({
            to: user.email,
            message: message
        })

        res.status(200).json({
            status: "success",
            message: "Token been sent"
        })
    }
    catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        console.log(err);

        return next(new AppError('Something went wrong, most likely server is down', 500))
    }
})

exports.resetPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user)
        return next(new AppError('Token is invalid or has expired', 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
})

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
})