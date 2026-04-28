// src/utils/sendEmail.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Firebase environment variable

export const sendEventReminder = async ({ to, subject, text }) => {
  try {
    const msg = {
      to,
      from: 'your-verified-email@example.com',
      subject,
      text,
    };
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};