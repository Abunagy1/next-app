// React use server directive:
/*
By adding the 'use server', you mark all the exported functions within the file as Server Actions.
These server functions can then be imported and used in Client and Server components. 
Any functions included in this file that are not used will be automatically
removed from the final application bundle.
You can also write Server Actions directly inside Server Components by adding "use server" inside the action.
But for now, we'll keep them all organized in a separate file.
We recommend having a separate file for your actions.
you'll need to extract the values of formData,
there are a couple of methods you can use. For this example,
let's use the .get(name) method.
*/
'use server';
// create a new async function that accepts formData:
// we'll use Zod, a TypeScript-first validation library that can simplify this task for you.
/*
Revalidate and redirect
Next.js has a client-side router cache that stores the route segments in the user's browser for a time.
Along with prefetching, this cache ensures that users can quickly navigate between routes
while reducing the number of requests made to the server.
Since you're updating the data displayed in the invoices route,
you want to clear this cache and trigger a new request to the server.
You can do this with the revalidatePath function from Next.js:
*/
import { revalidatePath } from 'next/cache';
// you also want to redirect the user back to the /dashboard/invoices page.
import { redirect } from 'next/navigation';
import { z } from 'zod';
//This schema will validate the formData before saving it to a database.
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from './email';
import Stripe from 'stripe';
import { getUserCustomerIds } from './data';
// import { signIn, signOut, auth } from '@/auth'; // we'll sign them in after registration
// import { AuthError } from 'next-auth';
//import { sql } from '@vercel/postgres';
//import { redirect } from 'next/navigation';
// ... existing imports and code
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// ---------- Invoice Schemas ----------
// const FormSchema = z.object({
//   id: z.string(),
//   customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
//   amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
//   status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please select an invoice status.' }),
//   date: z.string(),
// });
// const FormSchema = z.object({
//   id: z.string(),
//   customerId: z.string().min(1, { message: 'Please select a customer.' }), // ✅ correct
//   amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
//   status: z.enum(['pending', 'paid'], {
//     required_error: 'Please select an invoice status.',  // optional, for missing value
//     invalid_type_error: 'Please select an invoice status.' // for wrong type
//   }),
//   date: z.string(),
// });
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string().min(1, { message: 'Please select a customer.' }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
// const FormSchema = z.object({
//   id: z.string(),
//   customerId: z.string({
//     invalid_type_error: 'Please select a customer.',
//   }),
//   amount: z.coerce
//     .number()
//     .gt(0, { message: 'Please enter an amount greater than $0.' }),
//   status: z.enum(['pending', 'paid'], {
//     invalid_type_error: 'Please select an invoice status.',
//   }),
//   date: z.string(),
// });
import { Post, User } from './definitions';   // Add this line
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
// export async function updateInvoice(id: string, formData: FormData) {
//   const { customerId, amount, status } = UpdateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });
//   const amountInCents = amount * 100;
//   await sql`
//     UPDATE invoices
//     SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//     WHERE id = ${id}
//   `;
//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');
// }

// pass your rawFormData to CreateInvoice to validate the types
// export async function createInvoice(formData: FormData) {
//   const { customerId, amount, status } = CreateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });
//     //store monetary values in cents in your database to eliminate JavaScript floating-point errors and ensure greater accuracy.
//     const amountInCents = amount * 100;
//     //create a new date with the format "YYYY-MM-DD" for the invoice's creation date:
//     const date = new Date().toISOString().split('T')[0];
//     // SQL query to insert the new invoice into your database and pass in the variables:
//     await sql`INSERT INTO invoices (customer_id, amount, status, date)
//         VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
//     //the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server.
//     revalidatePath('/dashboard/invoices');
//     // You can do this with the redirect function from Next.js
//     redirect('/dashboard/invoices');
// }
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
// ---------- Invoice Actions ----------
export async function createInvoice(prevState: State, formData: FormData) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { message: 'Forbidden: Only admins can create invoices.' };
  }
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) return { message: 'Unauthorized' };
  const isAdmin = session.user.role === 'admin';
  // If not admin, check if invoice belongs to user's customers
  if (!isAdmin) {
    const userCustomerIds = await getUserCustomerIds(session.user.id);
    if (userCustomerIds.length === 0) {
      return { message: 'Forbidden: You do not own any invoices.' };
    }
    const invoice = await sql<{ customer_id: string }[]>`
      SELECT customer_id FROM invoices WHERE id = ${id}
    `;
    if (invoice.length === 0) return { message: 'Invoice not found' };
    if (!userCustomerIds.includes(invoice[0].customer_id)) {
      return { message: 'Forbidden: You do not have permission to update this invoice.' };
    }
  }
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
// export async function deleteInvoice(id: string) {
//   await sql`DELETE FROM invoices WHERE id = ${id}`;
//   revalidatePath('/dashboard/invoices');
// }
export async function deleteInvoice(id: string) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const isAdmin = session.user.role === 'admin';

  // If not admin, check ownership
  if (!isAdmin) {
    const userCustomerIds = await getUserCustomerIds(session.user.id);
    if (userCustomerIds.length === 0) {
      throw new Error('Forbidden: You do not own any invoices.');
    }
    const invoice = await sql<{ customer_id: string }[]>`
      SELECT customer_id FROM invoices WHERE id = ${id}
    `;
    if (invoice.length === 0) throw new Error('Invoice not found');
    if (!userCustomerIds.includes(invoice[0].customer_id)) {
      throw new Error('Forbidden: You do not have permission to delete this invoice.');
    }
  }
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to Delete Invoice');
  }
}



// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2026-02-25.clover', // use latest stable version
// });
// initialize Stripe without the apiVersion parameter
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Add payment method type
export type PaymentMethod = 'stripe' | 'bank_transfer' | 'ideal' | 'sepa_debit';

export async function createPaymentIntent(formData: FormData) {
  try {
    const productId = formData.get('productId') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 1;
    const paymentMethod = formData.get('paymentMethod') as PaymentMethod || 'stripe';
    
    const product = await getProductById(parseInt(productId));
    if (!product) throw new Error('Product not found');
    
    const amount = Math.round(product.price * quantity * 100); // in cents
    
    if (paymentMethod === 'stripe') {
      // Existing Stripe payment
      if (amount < 50) {
        return { error: 'Minimum purchase amount is $0.50' };
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { productId, quantity: quantity.toString() },
      });
      return { 
        clientSecret: paymentIntent.client_secret,
        paymentMethod: 'stripe'
      };
    } 
    else if (paymentMethod === 'bank_transfer') {
      // For bank transfer, return payment instructions
      return {
        paymentMethod: 'bank_transfer',
        bankDetails: {
          accountName: 'Your Company Name',
          accountNumber: '123456789',
          bankName: 'Your Bank',
          swiftCode: 'ABCDEF12',
          reference: `ORDER-${Date.now()}`,
          amount: amount / 100,
          currency: 'USD'
        }
      };
    }
    else if (paymentMethod === 'ideal') {
      // iDEAL (popular in Netherlands)
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'eur',
        payment_method_types: ['ideal'],
        metadata: { productId, quantity: quantity.toString() },
      });
      return {
        clientSecret: paymentIntent.client_secret,
        paymentMethod: 'ideal',
        nextAction: paymentIntent.next_action
      };
    }
    else if (paymentMethod === 'sepa_debit') {
      // SEPA Direct Debit
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'eur',
        payment_method_types: ['sepa_debit'],
        metadata: { productId, quantity: quantity.toString() },
      });
      return {
        clientSecret: paymentIntent.client_secret,
        paymentMethod: 'sepa_debit'
      };
    }
  } catch (error) {
    console.error('Payment creation failed:', error);
    return { error: 'Failed to initialize payment' };
  }
}
// ---------- Authentication ----------
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const { signIn } = await import('@/auth');
  const { AuthError } = await import('next-auth');
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard', // Change this
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// ---------- Password Reset ----------
export async function requestPasswordReset(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return 'Email is required';

  try {
    // Check if user exists
    const users = await sql<Pick<User, 'id'>[]>`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (users.length === 0) {
      // Don't reveal that user doesn't exist
      console.log('Password reset requested for non-existent email:', email);
      return 'If an account exists with that email, a reset link has been sent.';
    }

    const userId = users[0].id;

    // Generate token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this user (optional)
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;

    // Insert new token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires)
      VALUES (${userId}, ${token}, ${expires})
    `;

    // Send email (fire and forget)
    import('./email').then(({ sendPasswordResetEmail }) => {
      sendPasswordResetEmail(email, token).catch(console.error);
    });

    return 'If an account exists with that email, a reset link has been sent.';
  } catch (error) {
    console.error('Password reset request error:', error);
    return 'Something went wrong. Please try again.';
  }
}

export async function resetPassword(prevState: string | undefined, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!token || !password || !confirmPassword) return 'All fields are required';
  if (password !== confirmPassword) return 'Passwords do not match';
  if (password.length < 6) return 'Password must be at least 6 characters';

  try {
    // Find token
    const tokens = await sql<{ user_id: string; expires: Date }[]>`
      SELECT user_id, expires FROM password_reset_tokens WHERE token = ${token}
    `;
    if (tokens.length === 0) return 'Invalid or expired reset link';

    const { user_id, expires } = tokens[0];
    if (new Date() > new Date(expires)) return 'Reset link has expired';

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await sql`
      UPDATE users SET password = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${user_id}
    `;

    // Delete used token
    await sql`DELETE FROM password_reset_tokens WHERE token = ${token}`;

    // Redirect to login with success message
    redirect('/login?reset=1');
  } catch (error) {
    console.error('Password reset error:', error);
    return 'Failed to reset password. Please try again.';
  }
}
// ---------- Post Schemas ----------
const PostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  slug: z.string().optional(), // we'll generate it if not provided
  images: z.array(z.string()).optional(),
});
// Helper to generate a URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
// ---------- Post Actions ----------
// export async function createPost(prevState: string | undefined, formData: FormData) {
//   const session = await auth();
//   if (!session?.user?.id) {
//     return 'You must be logged in to create a post.';
//   }
//   const validatedFields = PostSchema.safeParse({
//     title: formData.get('title'),
//     content: formData.get('content'),
//   });
//   if (!validatedFields.success) {
//     return validatedFields.error.flatten().formErrors.join(', ');
//   }
//   const { title, content } = validatedFields.data;
//   const slug = generateSlug(title);
//   const now = new Date().toISOString();
//   try {
//     await sql`
//       INSERT INTO posts (slug, user_id, title, content, created_at, updated_at)
//       VALUES (${slug}, ${session.user.id}, ${title}, ${content}, ${now}, ${now})
//     `;
//   } catch (error) {
//     console.error('Database error:', error);
//     return 'Failed to create post.';
//   }
//   revalidatePath('/dashboard/posts');
//   redirect('/dashboard/posts');
// }
export async function createPost(prevState: string | undefined, formData: FormData) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) return 'You must be logged in to create a post.';
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const images = formData.getAll('images') as string[]; // array of URLs
  if (!title || !content) return 'Title and content are required';
  const slug = generateSlug(title);
  const now = new Date().toISOString();
  try {
    await sql`
      INSERT INTO posts (slug, user_id, title, content, images, created_at, updated_at)
      VALUES (${slug}, ${session.user.id}, ${title}, ${content}, ${images}, ${now}, ${now})
    `;
  } catch (error) {
    console.error('Database error:', error);
    return 'Failed to create post.';
  }
  revalidatePath('/dashboard/posts');
  redirect(`/blog/posts/${slug}`); // redirect to the public post page
}
export async function updatePost(
  postId: string,
  prevState: string | undefined,
  formData: FormData
) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) return 'Unauthorized';
  const isUserAdmin = session.user.role === 'admin';
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  //if (!title || !content) return 'Title and content are required';
  if (!validatedFields.success) {
    return validatedFields.error.flatten().formErrors.join(', ');
  }
  const { title, content } = validatedFields.data;
  const images = formData.getAll('images') as string[]; // Get all image URLs
  const slug = generateSlug(title);
  const now = new Date().toISOString();
  try {
    // Fetch the post to check ownership or admin status
    //const post = await sql`SELECT user_id FROM posts WHERE slug = ${postId}`;
    const post = await sql<Pick<Post, 'user_id'>[]>`
      SELECT user_id FROM posts WHERE slug = ${postId}
    `;
    if (post.length === 0) return 'Post not found';
    if (!isUserAdmin && post[0].user_id !== session.user.id) {
      return 'You do not have permission to edit this post.';
    }
    // if (post[0].user_id !== session.user.id) return 'You do not have permission to edit this post.';
    await sql`
      UPDATE posts
      SET title = ${title}, content = ${content}, slug = ${slug}, images = ${images}, updated_at = ${now}
      WHERE slug = ${postId}
    `;
  } catch (error) {
    console.error('Database error:', error);
    return 'Failed to update post.';
  }
  revalidatePath('/dashboard/posts');
  redirect('/dashboard/posts');
}
export async function deletePost(postId: string) {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  try {
    const isUserAdmin = session.user.role === 'admin';
    const post = await sql`SELECT user_id FROM posts WHERE slug = ${postId}`;
    if (post.length === 0) throw new Error('Post not found');
    if (!isUserAdmin && post[0].user_id !== session.user.id) {
      throw new Error('Permission denied');
    }
    // if (post[0].user_id !== session.user.id) throw new Error('Permission denied');
    await sql`DELETE FROM posts WHERE slug = ${postId}`;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to delete post.');
  }
  revalidatePath('/dashboard/posts');
  redirect('/dashboard/posts');
}
const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export async function signup(prevState: string | undefined, formData: FormData) {
  console.log('Signup started');
  const validatedFields = SignupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!validatedFields.success) {
    console.log('Validation failed:', validatedFields.error.flatten());
    return validatedFields.error.flatten().formErrors.join(', ');
  }
  const { name, email, password } = validatedFields.data;
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 Hashed password length:', hashedPassword.length);
  // Check if user already exists
  try {
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      console.log('User already exists:', email);
      return 'User with this email already exists.';
    }
  } catch (error) {
    console.error('Database error checking existing user:', error);
    return 'Something went wrong. Please try again.';
  }
  // Insert new user with hashedPassword
  try {
    await sql`
      INSERT INTO users (name, email, password, email_verified, image)
      VALUES (${name}, ${email}, ${hashedPassword}, FALSE, NULL)
    `;
    console.log('User inserted successfully:', email);
    // After inserting the new user, link any customers with the same email
    await sql`
      UPDATE customers
      SET user_id = (SELECT id FROM users WHERE email = ${email}),
          image_url = COALESCE((SELECT image FROM users WHERE email = ${email}), image_url)
      WHERE email = ${email}
    `;
  } catch (error) {
    console.error('Database error inserting user:', error);
    return 'Failed to create account. Please try again.';
  }
  // Generate verification token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  try {
    await sql`
      INSERT INTO verification_tokens (user_id, token, expires)
      VALUES ((SELECT id FROM users WHERE email = ${email}), ${token}, ${expires})
    `;
    console.log('Verification token inserted for:', email);
  } catch (error) {
    console.error('Database error inserting token:', error);
    // Continue – user can still log in but won't be verified
  }
  // Send verification email (fire and forget)
  console.log('📧 Attempting to send verification email to:', email);
  try {
    await sendVerificationEmail(email, token);
    console.log('✅ Verification email sent successfully');
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
  }
  // Log the verification link (always useful)
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  console.log('🔗 Verification link (copy and paste in browser):', verificationUrl);
  // Redirect to login with a success message
  redirect('/login?registered=1');
}

export async function updateProfile(prevState: string | undefined, formData: FormData) {
  import('server-only');
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) return 'Unauthorized';
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const image = formData.get('image') as string;
  const phone = formData.get('phone') as string || null;
  const city = formData.get('city') as string || null;
  const about = formData.get('about') as string || null;
  const birth_date = formData.get('birth_date') as string || null;
  if (!name || !email) return 'Name and email are required';
  try {
    // Check if email changed and if new email already exists
    if (email !== session.user.email) {
      const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) return 'Email already in use';
    }
    await sql`
      UPDATE users
      SET 
        name = ${name}, 
        email = ${email}, 
        image = ${image || null},
        phone = ${phone},
        city = ${city},
        about = ${about},
        birth_date = ${birth_date ? new Date(birth_date) : null},
        updated_at = NOW()
      WHERE id = ${session.user.id}
    `;
    // If the user’s image changed, also update the linked customer(s) image_url
    const linkedCustomers = await sql<{ id: string }[]>`
      SELECT id FROM customers WHERE user_id = ${session.user.id}
    `;
    if (linkedCustomers.length > 0) {
      await sql`
        UPDATE customers
        SET image_url = ${image || ''}
        WHERE user_id = ${session.user.id}
      `;
    }
    // If email changed, reset verification and send new verification email
    if (email !== session.user.email) {
      await sql`UPDATE users SET email_verified = FALSE WHERE id = ${session.user.id}`;
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO verification_tokens (user_id, token, expires)
        VALUES (${session.user.id}, ${token}, ${expires})
      `;
      sendVerificationEmail(email, token).catch(console.error);
    }
    revalidatePath('/dashboard/profiles');
    return 'Profile updated successfully';
  } catch (error) {
    console.error(error);
    return 'Failed to update profile';
  }
}
// export async function updateProfile(prevState: string | undefined, formData: FormData) {
//   const session = await auth();
//   if (!session?.user?.id) return 'Unauthorized';

//   const name = formData.get('name') as string;
//   const email = formData.get('email') as string;
//   const image = formData.get('image') as string;

//   if (!name || !email) return 'Name and email are required';

//   try {
//     // Check if email changed and if new email already exists
//     if (email !== session.user.email) {
//       const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
//       if (existing.rows.length > 0) return 'Email already in use';
//     }
//     await sql`
//       UPDATE users
//       SET name = ${name}, email = ${email}, image = ${image || null}
//       WHERE id = ${session.user.id}
//     `;

//     // If email changed, reset verification and send new verification email
//     if (email !== session.user.email) {
//       await sql`UPDATE users SET email_verified = FALSE WHERE id = ${session.user.id}`;

//       const token = randomBytes(32).toString('hex');
//       const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
//       await sql`
//         INSERT INTO verification_tokens (user_id, token, expires)
//         VALUES (${session.user.id}, ${token}, ${expires})
//       `;
//       sendVerificationEmail(email, token).catch(console.error);
//     }

//     revalidatePath('/dashboard/profile');
//     return 'Profile updated successfully';
//   } catch (error) {
//     console.error(error);
//     return 'Failed to update profile';
//   }
// }
export async function deleteAccount(_prevState: string | undefined, _formData: FormData) {
  const { auth } = await import('@/auth');
  const { signOut } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) return 'Unauthorized';
  try {
    // Delete user's posts first (cascade should handle if foreign key has CASCADE)
    await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM users WHERE id = ${session.user.id}`;
    // Sign out after deletion
    await signOut({ redirectTo: '/' });
  } catch (error) {
    console.error(error);
    return 'Failed to delete account';
  }
}
export async function updateUserRole(prevState: string | undefined, formData: FormData) {
  import('server-only');
  const { auth } = await import('@/auth');
  const session = await auth();
  if (session?.user?.role !== 'admin') return 'Forbidden';
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!userId || !role) return 'Missing data';
  try {
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
    revalidatePath('/dashboard/admin');
    return undefined;
  } catch (error) {
    console.error(error);
    return 'Failed to update role';
  }
}
export async function deleteUser(prevState: string | undefined, formData: FormData) {
  import('server-only');
  const { auth } = await import('@/auth');
  const session = await auth();
  if (session?.user?.role !== 'admin') return 'Forbidden';
  const userId = formData.get('userId') as string;
  if (!userId) return 'Missing user id';
  // Prevent admin from deleting themselves
  if (userId === session.user.id) return 'You cannot delete yourself';
  try {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    revalidatePath('/dashboard/admin');
    return undefined;
  } catch (error) {
    console.error(error);
    return 'Failed to delete user';
  }
}
// ---------- Sign Out ----------
export async function signOutAction() {
  const { signOut } = await import('@/auth');
  await signOut({ redirectTo: '/' });
}

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Product } from './definitions';
import { auth } from '@/auth';
//import { type } from 'os';

async function ensureProductsDir() {
  const dir = path.join(process.cwd(), 'public/products');
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    console.error('Failed to create products directory:', err);
  }
}

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const type = formData.get('type') as string;
  const imageFile = formData.get('image') as File;
  if (!name || !price || !type || !imageFile) throw new Error('Missing fields');
  await ensureProductsDir();
  const bytes = await imageFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${imageFile.name}`;
  const filepath = path.join(process.cwd(), 'public/products', filename);
  await writeFile(filepath, buffer);
  const result = await (sql<Product[]>`
    INSERT INTO products (name, price, image, type)
    VALUES (${name}, ${price}, ${filename}, ${type})
    RETURNING *
  ` as unknown as Promise<Product[]>);
  const product = result[0];
  if (!product) throw new Error('Insert failed');
  revalidatePath('/store/edit');
  return product;
}

export async function updateProduct(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const type = formData.get('type') as string;
  const imageFile = formData.get('image') as File | null;
  let filename: string | null = null; // ← use null, not undefined
  if (imageFile && imageFile.size > 0) {
    await ensureProductsDir();
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    filename = `${Date.now()}-${imageFile.name}`;
    const filepath = path.join(process.cwd(), 'public/products', filename);
    await writeFile(filepath, buffer);
  }
  // ✅ Now TypeScript knows filename can be string | null, both are acceptable.
  const result = await sql<Product[]>`
    UPDATE products
    SET name = ${name}, price = ${price}, type = ${type}, image = COALESCE(${filename}, image)
    WHERE id = ${id}
    RETURNING *
  `;
  const product = result[0];
  if (!product) {
    throw new Error('Product not found or update failed');
  }
  revalidatePath('/store/edit');
  return product;
}

export async function deleteProduct(id: number) {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
  await sql`DELETE FROM products WHERE id = ${id}`;
  revalidatePath('/store/edit');
}

import { getProductById } from './data';

export async function createStoreInvoice(formData: FormData) {
  const { auth } = await import('@/auth');
  const session = await auth();

  const productId = formData.get('productId') as string;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const postalCode = formData.get('postalCode') as string;
  const country = formData.get('country') as string;
  const paymentIntentId = formData.get('paymentIntentId') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const paymentReference = formData.get('paymentReference') as string;

  // Validate required fields
  if (!productId || !name || !email || !address || !city || !postalCode || !country) {
    return { error: 'All fields are required' };
  }

  // Fetch product
  const product = await getProductById(parseInt(productId));
  if (!product) return { error: 'Product not found' };

  const totalAmount = Math.round(product.price * quantity * 100); // in cents

  // Determine invoice status based on payment method
  const status = paymentMethod === 'bank_transfer' ? 'pending' : 'paid';

  // Find or create customer (same as before)
  let customerId: string;
  const existing = await sql<{ id: string }[]>`SELECT id FROM customers WHERE email = ${email}`;
  if (existing.length > 0) {
    customerId = existing[0].id;
    if (session?.user?.id) {
      await sql`UPDATE customers SET user_id = ${session.user.id}, image_url = COALESCE(${session.user.image || ''}, image_url) WHERE id = ${customerId}`;
    }
  } else {
    const imageUrl = session?.user?.image || '';
    const newCustomer = await sql<{ id: string }[]>`
      INSERT INTO customers (name, email, image_url, user_id)
      VALUES (${name}, ${email}, ${imageUrl}, ${session?.user?.id || null})
      RETURNING id
    `;
    customerId = newCustomer[0].id;
  }
  // Create invoice
  const items = [{ productId: product.id, name: product.name, price: product.price, quantity }];
  const shippingInfo = { name, address, city, postalCode, country };
  const date = new Date().toISOString().split('T')[0];

  const invoice = await sql<{ id: string }[]>`
    INSERT INTO invoices (
      customer_id, amount, status, date, items, shipping_info, 
      payment_intent_id, payment_method, payment_reference
    )
    VALUES (
      ${customerId}, ${totalAmount}, ${status}, ${date}, 
      ${JSON.stringify(items)}, ${JSON.stringify(shippingInfo)}, 
      ${paymentIntentId || null}, ${paymentMethod}, ${paymentReference || null}
    )
    RETURNING id
  `;
  const invoiceId = invoice[0].id;

  // Send confirmation email (fire and forget)
  import('./email').then(({ sendPurchaseConfirmation }) => {
    sendPurchaseConfirmation(email, { product, quantity, total: totalAmount / 100, invoiceId }).catch(console.error);
  });

  if (paymentMethod === 'bank_transfer') {
    return { invoiceId, message: 'Order placed. Please complete bank transfer.' };
  } else {
    redirect(`/store/checkout/success?invoiceId=${invoiceId}`);
  }
}