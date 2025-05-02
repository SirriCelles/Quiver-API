import nodemailer from 'nodemailer';

import {
  EMAIL_PASSWORD,
  EMAIL_NAME,
  EMAIL_HOST,
  EMAIL_PORT,
} from '../config/env.js';

const sendEMail = async (options) => {
  // create a transporter eg gmail or
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
      user: EMAIL_NAME,
      pass: EMAIL_PASSWORD,
    },
  });

  // Define the email options
  const mailOptions = {
    from: 'Sirri X <hello@sirri.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

export default sendEMail;
