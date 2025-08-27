import nodemailer from 'nodemailer';
import pug from 'pug';
import { htmlToText } from 'html-to-text';
import ErrorResponse from './errorResponse.js';

/**
 * @desc    Email class for sending emails
 */
class Email {
  /**
   * @param   {Object} user - User object
   * @param   {string} url - URL for email links
   */
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Rara.com <${process.env.EMAIL_FROM}>`;
  }

  /**
   * @desc    Create transport
   * @returns {Object} - Nodemailer transport
   */
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid for production
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    // Mailtrap for development
    return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // must be false for 587
            auth: {
              user: process.env.SMTP_EMAIL,
              pass: process.env.SMTP_PASSWORD
            }
          });
  }

  /**
   * @desc    Send the actual email
   * @param   {string} template - Pug template name
   * @param   {string} subject - Email subject
   * @returns {Promise}
   */
  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    };

    // 3) Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  /**
   * @desc    Send welcome email
   * @returns {Promise}
   */
  async sendWelcome() {
    await this.send('welcome', 'Welcome to Rara.com!');
  }

  /**
   * @desc    Send password reset email
   * @returns {Promise}
   */
  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)');
  }
}

/**
 * @desc    Send email wrapper function
 * @param   {Object} options - Email options
 * @param   {string} options.email - Recipient email
 * @param   {string} options.subject - Email subject
 * @param   {string} options.message - Email message
 * @returns {Promise}
 * @throws  {ErrorResponse} - If email sending fails
 */

export const sendEmail = async ({ email, subject, message }) => {
  console.log(email, subject, message);
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // use true for 465
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Optional debug
    await transporter.verify();

    await transporter.sendMail({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Email sending error:", err);
    throw new ErrorResponse("Email could not be sent", 500);
  }
};


export default Email;