import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SALT_ROUND } from '../config/env.js';

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
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
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  photo: {
    type: String,
  },
});

userSchema.set('toJSON', {
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

// adding and instance method to confirm password
userSchema.methods.verifyPassword = async function (
  signInPasword,
  userPassword,
) {
  return await bcrypt.compare(signInPasword, userPassword);
};

const User = mongoose.model('User', userSchema);

export default User;
