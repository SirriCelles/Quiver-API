import mongoose from 'mongoose';

import { DB_CONNECTION_URL } from '../config/env.js';

if (!DB_CONNECTION_URL) {
  throw new Error('Please define db URI. No URI found');
}

const connectToDB = async () => {
  try {
    await mongoose.connect(DB_CONNECTION_URL);
    console.log('DB connection successful');
  } catch (error) {
    console.log('Error connecting to database: ', error);
    process.exit();
  }
};

export default connectToDB;
