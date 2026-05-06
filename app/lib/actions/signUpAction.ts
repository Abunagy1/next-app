'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import dataModels from '@/app/lib/db/models';
import { isValidJSON } from '@/app/lib/utils';
import { createAnalytics, incOrDecrementAnalytics } from '@/app/lib/services/analytics';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { generateAvatar } from '@/app/lib/utils.server';
import { createUniqueCustomer } from '@/app/lib/paymentIntegration/stripe';
import emailDefaultData from '@/data/emailDefaultData';
import { newUserSignupEmailTemplate } from '@/app/lib/email/templates';
import sendEmail from '@/app/lib/email/sendEmail';

// Define a transaction type for PostgreSQL
type PgTransaction = {
  (strings: TemplateStringsArray, ...exprs: any[]): Promise<any>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

const phoneSchema = z.object({
  number: z.string().regex(/^\d+$/),
  dialCode: z.string().min(1),
});

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    acceptTerms: z.string().regex(/on/),
    phone: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return undefined;
        if (!isValidJSON(val)) return undefined;
        const parsed = JSON.parse(val);
        if (typeof parsed === 'object' && parsed !== null && 'number' in parsed && 'dialCode' in parsed) {
          return parsed;
        }
        return undefined;
      })
      .pipe(phoneSchema.optional()),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function signUpAction(prevState: any, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const { email, password, firstname, lastname, phone } = parsed.data;

  // Check if user already exists
  if (dbType === 'postgres') {
    const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (rows.length > 0) {
      return { success: false, error: { email: 'User already exists' } };
    }
  } else {
    await connectDB();
    const exists = await dataModels.User.exists({ email });
    if (exists) {
      return { success: false, error: { email: 'User already exists' } };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatar = await generateAvatar(firstname);

  let customerId: string | null = null;
  try {
    const customer = await createUniqueCustomer(
      { name: `${firstname} ${lastname}`, email },
      undefined,
      ['email'] as any
    );
    customerId = customer.id;
  } catch (error: any) {
    if (error.type !== 'StripeConnectionError') {
      console.warn('Stripe customer creation failed, proceeding without customerId');
    }
  }

  const coverImage = 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=1170&auto=format&fit=crop';

  // Define common user object (used by both PostgreSQL and MongoDB)
  const userObj = {
    firstName: firstname,
    lastName: lastname,
    email,
    emailVerifiedAt: null,
    emails: [{ email, primary: true }],
    image: avatar, // unified Profile Image name instead of profileImage
    coverImage,
    phoneNumbers: phone ? [{ number: phone.number, dialCode: phone.dialCode, primary: true }] : [],
    address: null,
    birth_date: null,               // unified field
    flights: {},
    hotels: {},
    rewardPoints: { totalPoints: 0, pointHistory: [] },
    customerId,
  };

  if (dbType === 'postgres') {
    const trx = await sql.begin() as PgTransaction;
    try {
      const userId = randomUUID();
      const accountId = randomUUID();

      await trx`
        INSERT INTO users (
          id, first_name, last_name, email, emails, image, cover_image,
          phone_numbers, address, birth_date, customer_id, flights, hotels,
          reward_points, created_at, updated_at
        ) VALUES (
          ${userId}, ${userObj.firstName}, ${userObj.lastName}, ${userObj.email},
          ${JSON.stringify(userObj.emails)}::jsonb,
          ${userObj.image}, ${userObj.coverImage},
          ${JSON.stringify(userObj.phoneNumbers)}::jsonb,
          ${userObj.address}, ${userObj.birth_date}, ${userObj.customerId},
          ${JSON.stringify(userObj.flights)}::jsonb, ${JSON.stringify(userObj.hotels)}::jsonb,
          ${JSON.stringify(userObj.rewardPoints)}::jsonb,
          NOW(), NOW()
        )
      `;

      await trx`
        INSERT INTO accounts (
          id, user_id, provider, provider_account_id, type, password, created_at, updated_at
        ) VALUES (
          ${accountId}, ${userId}, 'credentials', ${userId}, 'credentials', ${hashedPassword},
          NOW(), NOW()
        )
      `;
      await trx.commit();
      await incOrDecrementAnalytics({ totalUsersSignedUp: 1 });
    } catch (error) {
      await trx.rollback();
      console.error('PostgreSQL signup error:', error);
      return { success: false, message: 'Something went wrong, try again' };
    }
  } else {
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      await createAnalytics();
      const user = await createOneDoc('User', userObj, { session: mongoSession });
      const accountObj = {
        userId: user._id,
        provider: 'credentials',
        providerAccountId: user._id.toString(),
        type: 'credentials',
        password: hashedPassword,
      };
      await createOneDoc('Account', accountObj, { session: mongoSession });
      await mongoSession.commitTransaction();
      await incOrDecrementAnalytics({ totalUsersSignedUp: 1 });
    } catch (error) {
      if (mongoSession.inTransaction()) await mongoSession.abortTransaction();
      console.error('MongoDB signup error:', error);
      return { success: false, message: 'Something went wrong, try again' };
    } finally {
      mongoSession.endSession();
    }
  }

  // Send welcome email
  try {
    const htmlEmail = newUserSignupEmailTemplate({
      ...emailDefaultData,
      main: { firstName: firstname },
    });
    await sendEmail([{ Email: email }], 'Welcome to Golobe', htmlEmail);
  } catch (e) {
    console.warn('Welcome email failed:', e);
  }

  return { success: true, message: 'User created successfully' };
}