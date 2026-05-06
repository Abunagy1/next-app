import Mailjet from 'node-mailjet';
import { ensureHelpersRegistered } from './initHelpers';
ensureHelpersRegistered();
const mailjet = new Mailjet({
  apiKey: process.env.MAIL_API_TOKEN!,
  apiSecret: process.env.MAIL_SECRET_TOKEN!,
});

type Recipient = {
  Email: string;
  Name?: string;
};

/**
 * Sends an email using Mailjet.
 * @param recipientEmails - Array of recipient objects { Email, Name? }
 * @param subject - Email subject
 * @param body - HTML email body
 */
export default async function sendEmail(
  recipientEmails: Recipient[],
  subject: string,
  body: string
): Promise<void> {
  try {
    //ensureHelpersRegistered();
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAIL_SENDER_EMAIL!,
            Name: 'GoBye Travel Agency',
          },
          To: recipientEmails,
          Subject: subject,
          HTMLPart: body,
        },
      ],
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}