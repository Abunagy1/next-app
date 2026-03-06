
// if you want to switch to Resend, uncomment this code and make sure to set RESEND_API_KEY in your .env file. You can get a free API key by signing up at https://resend.com. Resend is a great service for sending transactional emails and is very easy to integrate with Next.js.
//import nodemailer from 'nodemailer';
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
// export async function sendVerificationEmail(email: string, token: string) {
//   console.log('📨 Inside sendVerificationEmail, sending to:', email);
//   try {
//     const result = await resend.emails.send({
//       from: 'onboarding@resend.dev',
//       to: email,
//       subject: 'Verify your email',
//       html: `<a href="${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}">Verify</a>`,
//     });
//     console.log('✅ Resend API response:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ Resend API error:', error);
//     throw error; // re-throw so the caller can catch it
//   }
// }
import nodemailer from 'nodemailer';
// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASSWORD,
  },
});
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.MAIL_ID}>`, // sender address
      to: email, // list of receivers
      subject: 'Verify your email', // Subject line
      html: `<p>Please verify your email by clicking the link below:</p>
             <a href="${verificationUrl}">Verify Email</a>`, // HTML body
    });
    console.log('✅ Verification email sent. Message ID:', info.messageId);
    // For Gmail, you can also use the preview URL provided by Nodemailer (if using Ethereal, but not needed here)
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error; // Re-throw so the caller can handle it
  }
}
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Your App" <${process.env.MAIL_ID}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
  console.log('✅ Password reset email sent. Message ID:', info.messageId);
}

export async function sendPurchaseConfirmation(email: string, details: any) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: `"Your Store" <${process.env.MAIL_ID}>`,
    to: email,
    subject: 'Purchase Confirmation',
    html: `
      <h1>Thank you for your purchase!</h1>
      <p>Product: ${details.product.name} x ${details.quantity}</p>
      <p>Total: $${details.total.toFixed(2)}</p>
      <p>Invoice ID: ${details.invoiceId}</p>
      <p>You will receive your order at the provided address.</p>
    `,
  });
  console.log('✅ Purchase confirmation email sent:', info.messageId);
}
// OR If you don't have a Resend key yet, you can temporarily switch back to Ethereal (which worked earlier) by reverting app/lib/email.ts:
// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//     user: process.env.ETHEREAL_USER || '',
//     pass: process.env.ETHEREAL_PASS || '',
//   },
// });
// export async function sendVerificationEmail(email: string, token: string) {
//   const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
//   try {
//     const info = await transporter.sendMail({
//       from: '"Your App" <noreply@yourapp.com>',
//       to: email,
//       subject: 'Verify your email address',
//       html: `
//         <p>Hello,</p>
//         <p>Please verify your email by clicking the link below:</p>
//         <a href="${verificationUrl}">${verificationUrl}</a>
//         <p>This link expires in 24 hours.</p>
//       `,
//     });
//     console.log('✅ Email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
//     return info;
//   } catch (error) {
//     console.error('❌ Failed to send email:', error);
//     throw error;
//   }
// }

export async function sendContactEmails(name: string, userEmail: string, message: string) {
  // console.log('📨 sendContactEmails called with:', { name, userEmail, messageLength: message.length });
  // console.log('MAIL_ID exists:', !!process.env.MAIL_ID);
  // console.log('MAIL_PASSWORD exists:', !!process.env.MAIL_PASSWORD);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  // Email to admin (you)
  const adminMail = await transporter.sendMail({
    from: `"Contact Form" <${process.env.MAIL_ID}>`,
    to: process.env.MAIL_ID,
    subject: `New contact message from ${name}`,
    html: `
      <h1>New Contact Message</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
    `,
  });
  // Confirmation email to user
  const userMail = await transporter.sendMail({
    from: `"Your Name" <${process.env.MAIL_ID}>`,
    to: userEmail,
    subject: 'Thank you for contacting us',
    html: `
      <h1>Thank you for reaching out!</h1>
      <p>Dear ${name},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      <p>Here is a copy of your message:</p>
      <blockquote>${message.replace(/\n/g, '<br>')}</blockquote>
      <p>Best regards,<br>Your Team</p>
    `,
  });
  console.log('✅ Contact emails sent:', adminMail.messageId, userMail.messageId);
}