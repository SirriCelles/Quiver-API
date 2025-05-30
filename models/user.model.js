import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SALT_ROUND } from '../config/env.js';

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Duplicate Email not allowed'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid Email'],
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'escort'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be greater than 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password mismatch, confirm your password',
      },
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    profile: {
      fullName: {
        type: String,
        required: [true, 'Fullname is required. Please provide your full name'],
      },
      bio: String,
      imageName: String, //ImageName for when we use file system
      imageUrl: String, //URL to S3/cloudinary image,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'other', 'prefer not to say'],
      },
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        //GeoJSON format [long, lat]
        type: [Number],
        index: '2dshpere', //Geospatial index
      },
    },
    preferences: {
      tags: [String],
      language: {
        type: String,
        default: 'en',
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
    },
    verificationDocs: {
      govIdNumber: Number,
      govIdUrlName: String,
      govIdUrl: String,
      driverIdNumber: Number,
      driverIdUrlName: String,
      driverIdUrl: String,
    },
    phone: {
      type: String,
      validate: [
        validator.isMobilePhone,
        'Please provide a valide phone number',
      ],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    termsAndConditions: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ location: '2dsphere' });

userSchema.virtual('age').get(function () {
  if (this.profile?.dateOfBirth) {
    const today = new Date();
    const birth = new Date(this.profile.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }
  return null;
});

userSchema.virtual('escortProfile', {
  ref: 'Escort',
  localField: '_id',
  foreignField: '_userRef',
  justOne: true,
});

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
});

userSchema.pre('save', async function (next) {
  // check if password has not been modified(in that case we do not need to hash) then skip
  if (!this.isModified('password')) return next();

  // if password is new Hash password
  this.password = await bcrypt.hash(this.password, SALT_ROUND * 1);
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('location') && this.location?.lat) {
    // convert location to GeoJSON format
    this.location = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat],
    };
  }
  next();
});

userSchema.pre(/^find/, function (next) {
  this.select('-__v -verificationDocs -phone');
  next();
});

// adding and instance method to confirm password
userSchema.methods.verifyPassword = async function (
  signInPasword,
  userPassword,
) {
  return await bcrypt.compare(signInPasword, userPassword);
};

userSchema.methods.checkForChangedPassword = async function (jwtTimestamp) {
  if (this.passwordChangedAt && this.passwordChangedAt !== null) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return jwtTimestamp < changeTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  // use an 32 byte cryptographic random string
  const resetToken = await crypto.randomBytes(32).toString('hex');

  // encrypt resetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set password reset token to expire in 10minutes
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
