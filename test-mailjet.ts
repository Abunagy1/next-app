import dotenv from 'dotenv';
dotenv.config({ path: '.env' });       // adjust path if needed

import Mailjet from 'node-mailjet';

const mailjet = new Mailjet({
  apiKey: process.env.MAIL_API_TOKEN!,
  apiSecret: process.env.MAIL_SECRET_TOKEN!,
});

mailjet.post('send', { version: 'v3.1' }).request({
  Messages: [{
    From: { Email: process.env.MAIL_SENDER_EMAIL!, Name: 'Test' },
    To: [{ Email: 'your-own-email@example.com' }],  // change to your email
    Subject: 'Test connection',
    HTMLPart: '<p>Hello, this is a test.</p>',
  }],
})
.then(res => console.log('✅ Success', res.body))
.catch(err => console.error('❌ Error', err.statusCode, err.message));