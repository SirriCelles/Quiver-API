import nodemailer from 'nodemailer';
import pug from 'pug';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { convert } from 'html-to-text';
import {
  EMAIL_PASSWORD,
  EMAIL_NAME,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_FROM,
  NODE_ENV,
} from '../config/env.js';
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.profile.fullName.split(' ')[0];
    this.url = url;
    this.from = `Quiver <${EMAIL_FROM}>`;
  }

  createTransport() {
    // if (NODE_ENV === 'production') {
    //   // Create a sendgrid  transporter
    //   return 1;
    // }

    // create a transporter eg gmail or
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: EMAIL_NAME,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render HTML based on a pug template
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Use the pug template to render the HTML
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html, // Use the rendered HTML if available
      text: convert(html), // Convert HTML to text
    };

    // Create a transporter
    const transporter = this.createTransport();

    // Send email
    await transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', `Welcome to Quiver--Let's get started!`);
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
}

export default Email;
