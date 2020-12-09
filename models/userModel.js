const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    login: {
        type: String,
        minlength: 3,
        required: [true, "Provide login"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Provide password"],
        minlength: 6,
        select: false
    },
    passwordConfirm:{
        type: String,
        required: [true, "Provide repeated passport"],
        validate: {
            validator: function(el){
                return el === this.password;
            },
            message: "Password is not the same"
        }
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        validator: [validator.isEmail, 'Please provide valid email']
    },
    passwordChangedAt: {
        type: Date,
        default: null
    },
    passwordResetToken: String,
    passwordResetExpires: Date
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
})

userSchema.methods.checkPassword = async function(candidatePassword, password){
    return await bcrypt.compare(candidatePassword, password);
}

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
}

userSchema.methods.createUserResetToken = async function (){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

module.exports = mongoose.model('User', userSchema);