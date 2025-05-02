import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  NODE_ENV,
  PORT,
  SERVER_URL,
  DB_CONNECTION_URL,
  SALT_ROUND,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN,
  EMAIL_NAME,
  EMAIL_PASSWORD,
  EMAIL_HOST,
  EMAIL_PORT,
} = process.env;
