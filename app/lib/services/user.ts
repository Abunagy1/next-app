import 'server-only';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { generateAvatar } from '@/app/lib/utils.server';
import { createUniqueCustomer } from '@/app/lib/paymentIntegration/stripe';
import initStripe from '@/app/lib/paymentIntegration/stripe';

/*
We have a naming inconsistency between the unified database fields (image, birth_date) and the old project’s component props (profileImage, dateOfBirth).
The current mapping in getUserDetails is intentional – it allows existing components to receive the data they expect without a massive rewrite.
You should keep these aliases in the service file because dozens of components across the project rely on profileImage and dateOfBirth. 
Removing them would break all those parts.
*/

// ---------- Types ----------
export interface UserDetails {
  _id?: string;
  id?: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  emails?: { email: string; primary: boolean; emailVerifiedAt?: string | null; inVerification?: boolean }[];
  image?: string;                  // avatar / profile picture Unified DB field
  //profileImage?: string;           // Alias Mapped from image for old project if needed but we removed all traces for this field name, socomment it
  coverImage?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  phone?: string;
  phoneNumbers?: { number: string; dialCode: string; primary: boolean; verifiedAt?: string | null; inVerification?: boolean }[];
  city?: string;
  about?: string;
  birth_date?: Date | string | null;      // Unified DoB field
  //dateOfBirth?: Date | string | null; // Alias was Mapped from birth_date for old project but removed all traces for it, so commented out
  address?: string | null;
  customerId?: string | null;
  role?: string;
  flights?: any;
  hotels?: any;
  rewardPoints?: any;
  userSettings?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: { number: string; dialCode: string };
}

// ---------- Helper: Map PostgreSQL row to UserDetails ----------
function mapPostgresUser(row: any): UserDetails {
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    emails: row.emails,
    image: row.image,
    //profileImage: row.image,               // map for old project
    coverImage: row.cover_image,
    emailVerified: row.email_verified,
    emailVerifiedAt: row.email_verified_at,
    phone: row.phone,
    phoneNumbers: row.phone_numbers,
    city: row.city,
    about: row.about,
    birth_date: row.birth_date,
    //dateOfBirth: row.birth_date,           // map for old project
    address: row.address,
    customerId: row.customer_id,
    role: row.role,
    flights: row.flights,
    hotels: row.hotels,
    rewardPoints: row.reward_points,
    userSettings: row.user_settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------- Get User Details by ID ----------
export async function getUserDetails(userId: string, revalidate = 600): Promise<UserDetails | null> {
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT
        id,
        name,
        first_name,
        last_name,
        email,
        emails,
        image,
        cover_image,
        email_verified,
        email_verified_at,
        phone,
        phone_numbers,
        city,
        about,
        birth_date,
        address,
        customer_id,
        role,
        flights,
        hotels,
        reward_points,
        user_settings,
        created_at,
        updated_at
      FROM users
      WHERE id = ${userId}
    `;
    if (rows.length === 0) return null;
    return mapPostgresUser(rows[0]);
  } else {
    await connectDB();
    const user = await getOneDoc('User', { _id: strToObjectId(userId) }, ['userDetails'], revalidate);
    if (!user || Object.keys(user).length === 0) return null;
    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emails: user.emails,
      image: user.image,
      //profileImage: user.image,                 // map for old project, this is the way you make an Alias if you don't want to trace the name and remove it 
      coverImage: user.coverImage,
      emailVerified: user.email_verified,
      emailVerifiedAt: user.emailVerifiedAt,
      phone: user.phone,
      phoneNumbers: Array.isArray(user.phone_numbers) ? user.phone_numbers : (typeof user.phone_numbers === 'string' ? JSON.parse(user.phone_numbers) : []),
      //phoneNumbers: user.phoneNumbers,
      city: user.city,
      about: user.about,
      birth_date: user.birth_date,
      //dateOfBirth: user.birth_date,             // map for old project, this is the way you make an Alias if you don't want to trace the name and remove it
      address: user.address,
      customerId: user.customerId,
      role: user.role,
      flights: user.flights,
      hotels: user.hotels,
      rewardPoints: user.rewardPoints,
      userSettings: user.userSettings,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// ---------- Create a New User ----------
export async function createUser(
  { firstName, lastName, email, phone }: CreateUserParams,
  options: any = {}
): Promise<UserDetails> {
  const avatar = await generateAvatar(firstName);
  const userObj: any = {
    name: `${firstName} ${lastName}`,
    email,
    email_verified: false,
    image: avatar,
    phone: phone ? `${phone.dialCode}${phone.number}` : null,
    city: null,
    about: null,
    birth_date: null,
    role: 'user',
    firstName,
    lastName,
    emails: [{ email, primary: true }],
    coverImage: 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=1170&auto=format&fit=crop',
    emailVerifiedAt: null,
    phoneNumbers: phone ? [{ number: phone.number, dialCode: phone.dialCode, primary: true }] : [],
    address: null,
    flights: {},
    hotels: {},
    rewardPoints: { totalPoints: 0, pointHistory: [] },
    userSettings: {},
    customerId: null,
  };

  // Stripe customer handling
  let customerId: string | null = null;
  try {
    const stripe = initStripe();
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const idempotencyKey = `create_customer_${email}_${Date.now()}`;
      const customer = await createUniqueCustomer(
        { name: `${firstName} ${lastName}`, email },
        { idempotencyKey },
        ['email']
      );
      customerId = customer.id;
    }
    userObj.customerId = customerId;
  } catch (error: any) {
    console.error('Stripe customer operation failed:', error);
  }
  if (dbType === 'postgres') {
    const inserted = await sql`
      INSERT INTO users (
        name, email, email_verified, email_verified_at, image,
        phone, city, about, birth_date, role,
        first_name, last_name, emails, cover_image, phone_numbers, address,
        flights, hotels, reward_points, user_settings, customer_id,
        created_at, updated_at
      ) VALUES (
        ${userObj.name}, ${userObj.email}, ${userObj.email_verified}, ${userObj.emailVerifiedAt},
        ${userObj.image},
        ${userObj.phone}, ${userObj.city}, ${userObj.about}, ${userObj.birth_date}, ${userObj.role},
        ${userObj.firstName}, ${userObj.lastName},
        ${JSON.stringify(userObj.emails)}::jsonb,
        ${userObj.coverImage},
        ${JSON.stringify(userObj.phoneNumbers)}::jsonb,
        ${userObj.address},
        ${JSON.stringify(userObj.flights)}::jsonb,
        ${JSON.stringify(userObj.hotels)}::jsonb,
        ${JSON.stringify(userObj.rewardPoints)}::jsonb,
        ${JSON.stringify(userObj.userSettings)}::jsonb,
        ${userObj.customerId},
        NOW(), NOW()
      )
      RETURNING id, created_at, updated_at
    `;
    const row = inserted[0];
    return {
      id: row.id,
      name: userObj.name,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      email: userObj.email,
      emails: userObj.emails,
      image: userObj.image,
      //profileImage: userObj.image,                // map for old project
      coverImage: userObj.coverImage,
      emailVerified: userObj.email_verified,
      emailVerifiedAt: userObj.emailVerifiedAt,
      phone: userObj.phone,
      phoneNumbers: userObj.phoneNumbers,
      city: userObj.city,
      about: userObj.about,
      birth_date: userObj.birth_date,
      //dateOfBirth: userObj.birth_date,            // map for old project
      address: userObj.address,
      customerId: userObj.customerId,
      role: userObj.role,
      flights: userObj.flights,
      hotels: userObj.hotels,
      rewardPoints: userObj.rewardPoints,
      userSettings: userObj.userSettings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } else {
    await connectDB();
    const user = await createOneDoc('User', { ...userObj, email }, options);
    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emails: user.emails,
      image: user.image,
      //profileImage: user.image,                   // map for old project
      coverImage: user.coverImage,
      emailVerified: user.email_verified,
      emailVerifiedAt: user.emailVerifiedAt,
      phone: user.phone,
      phoneNumbers: user.phoneNumbers,
      city: user.city,
      about: user.about,
      birth_date: user.birth_date,
      //dateOfBirth: user.birth_date,               // map for old project
      address: user.address,
      customerId: user.customerId,
      role: user.role,
      flights: user.flights,
      hotels: user.hotels,
      rewardPoints: user.rewardPoints,
      userSettings: user.userSettings,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// ---------- Create an Account (for authentication) ----------
export async function createAccount(
  {
    userId,
    provider = 'credentials',
    providerAccountId,
    type = 'credentials',
    password,
  }: {
    userId: string;
    provider?: string;
    providerAccountId: string;
    type?: string;
    password?: string;
  },
  options: any = {}
): Promise<any> {
  const accountObj: any = {
    userId,
    provider,
    providerAccountId,
    type,
    password,
  };

  if (dbType === 'postgres') {
    const inserted = await sql`
      INSERT INTO accounts (
        user_id, provider, provider_account_id, type, password, created_at, updated_at
      ) VALUES (
        ${userId}, ${provider}, ${providerAccountId}, ${type}, ${password}, NOW(), NOW()
      )
      RETURNING id
    `;
    return inserted[0];
  } else {
    await connectDB();
    return createOneDoc('Account', accountObj, options);
  }
}

