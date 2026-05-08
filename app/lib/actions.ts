'use server';
import { revalidatePath } from 'next/cache';
// you also want to redirect the user back to the /dashboard/invoices page.
import { redirect } from 'next/navigation';
import { z } from 'zod';
//This schema will validate the formData before saving it to a database.
//import postgres from 'postgres';
import { randomBytes } from 'crypto';
import { sendVerificationEmail, sendContactEmails } from './email';
import Stripe from 'stripe';
import { getUserCustomerIds, getProductById } from './data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
// ... existing imports and code
//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
//mongoose.Types.ObjectId for converting strings to ObjectIds may need mongose
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { Post, User, Product } from './definitions';   // Add this line
import sendEmail from '@/app/lib/email/sendEmail';

//import { type } from 'os';
// ---------- Invoice Schemas ----------
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string().min(1, { message: 'Please select a customer.' }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
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
  // const { auth } = await import('@/auth');
  // const session = await auth();
  const session = await getServerSession(authOptions);
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
  if (dbType === 'postgres') {
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (err) {
      // If a database error occurs, return a more specific error.
      return {
        message: 'Database Error: Failed to Create Invoice.', error: (err as Error).message
      };
    }
  } else {
    await connectDB();
    // Fetch customer details to embed
    const customer = await dataModels.Customer.findById(customerId).lean();
    if (!customer) {
      return { message: 'Customer not found.' };
    }
    try {
      await dataModels.Invoice.create({
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        },
        amount: amountInCents,
        status,
        date,
      });
    } catch (error) {
      console.error(error);
      return { message: 'Database Error: Failed to Create Invoice.' };
    }
  }  
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
// ---------- Update Invoice ----------
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // const { auth } = await import('@/auth');
  // const session = await auth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { message: 'Unauthorized' };
  const isAdmin = session.user.role === 'admin';
  if (dbType === 'postgres') {
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
      return { message: 'Database Error: Failed to Update Invoice.', error: (error as Error).message };
    }
  } else {
    // MongoDB logic
    await connectDB();
    if (!isAdmin) {
      const userCustomerIds = await getUserCustomerIds(session.user.id);
      if (userCustomerIds.length === 0) {
        return { message: 'Forbidden: You do not own any invoices.' };
      }
      const invoice = await dataModels.Invoice.findById(id).lean();
      if (!invoice) return { message: 'Invoice not found' };
      if (!userCustomerIds.includes(invoice.customer.id.toString())) {
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
    // Fetch the new customer to embed
    const newCustomer = await dataModels.Customer.findById(customerId).lean();
    if (!newCustomer) return { message: 'Customer not found' };
    try {
      await dataModels.Invoice.updateOne(
        { _id: id },
        {
          $set: {
            customer: {
              id: newCustomer._id,
              name: newCustomer.name,
              email: newCustomer.email,
              image_url: newCustomer.image_url,
            },
            amount: amountInCents,
            status,
          }
        }
      );
    } catch (error) {
      console.error(error);
      return { message: 'Database Error: Failed to Update Invoice.' };
    }
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
// ---------- Delete Invoice ----------
export async function deleteInvoice(id: string) {
  // const { auth } = await import('@/auth');
  // const session = await auth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized');
  const isAdmin = session.user.role === 'admin';
  if (dbType === 'postgres') {
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
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to Delete Invoice', { cause: error });
    }
  } else {
    // MongoDB logic
    await connectDB();
    if (!isAdmin) {
      const userCustomerIds = await getUserCustomerIds(session.user.id);
      if (userCustomerIds.length === 0) {
        throw new Error('Forbidden: You do not own any invoices.');
      }
      const invoice = await dataModels.Invoice.findById(id).lean();
      if (!invoice) throw new Error('Invoice not found');
      if (!userCustomerIds.includes(invoice.customer.id.toString())) {
        throw new Error('Forbidden: You do not have permission to delete this invoice.');
      }
    }
    try {
      await dataModels.Invoice.deleteOne({ _id: id });
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to Delete Invoice', { cause: error });
    }
  }
  revalidatePath('/dashboard/invoices');
}
// ---------- Stripe Payment Intent ----------
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
// ----------   ----------
// ---------- Request Password Reset ----------
// ----------   ----------
export async function requestPasswordReset(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return 'Email is required';
  if (dbType === 'postgres') {
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
  } else {
    // MongoDB logic
    try {
      await connectDB();
      const user = await dataModels.User.findOne({ email }).lean();
      if (!user) {
        console.log('Password reset requested for non-existent email:', email);
        return 'If an account exists with that email, a reset link has been sent.';
      }
      const userId = user._id;
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await dataModels.PasswordResetToken.deleteMany({ user_id: userId });
      await dataModels.PasswordResetToken.create({
        user_id: userId,
        token,
        expires,
      });
      import('./email').then(({ sendPasswordResetEmail }) => {
        sendPasswordResetEmail(email, token).catch(console.error);
      });
      return 'If an account exists with that email, a reset link has been sent.';
    } catch (error) {
      console.error('Password reset request error:', error);
      return 'Something went wrong. Please try again.';
    }
  }
}
// ---------- Reset Password ----------
export async function resetPassword(prevState: string | undefined, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  if (!token || !password || !confirmPassword) return 'All fields are required';
  if (password !== confirmPassword) return 'Passwords do not match';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (dbType === 'postgres') {
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
    } catch (error) {
      console.error('Password reset error:', error);
      return 'Failed to reset password. Please try again.';
    }
  } else {
    // MongoDB logic
    try {
      await connectDB();
      const tokenDoc = await dataModels.PasswordResetToken.findOne({ token }).lean();
      if (!tokenDoc) return 'Invalid or expired reset link';
      if (new Date() > new Date(tokenDoc.expires)) return 'Reset link has expired';
      const hashedPassword = await bcrypt.hash(password, 10);
      await dataModels.User.updateOne(
        { _id: tokenDoc.user_id },
        { $set: { password: hashedPassword, updated_at: new Date() } }
      );
      await dataModels.PasswordResetToken.deleteOne({ token });
    } catch (error) {
      console.error('Password reset error:', error);
      return 'Failed to reset password. Please try again.';
    }
  }
  // Redirect to login with success message
  redirect('/user/login?reset=1');
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
// ---------- Create Post ----------
export async function createPost(prevState: string | undefined, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 'You must be logged in to create a post.';
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const images = formData.getAll('images') as string[];
  if (!title || !content) return 'Title and content are required';
  const slug = generateSlug(title);
  const now = new Date().toISOString();
  if (dbType === 'postgres') {
    try {
      await sql`
        INSERT INTO posts (slug, user_id, title, content, images, created_at, updated_at)
        VALUES (${slug}, ${session.user.id}, ${title}, ${content}, ${images}, ${now}, ${now})
      `;
    } catch (error) {
      console.error('Database error:', error);
      return 'Failed to create post.';
    }
  } else {
    try {
      await connectDB();
      await dataModels.Post.create({
        slug,
        user_id: session.user.id,
        title,
        content,
        images,
        created_at: new Date(now),
        updated_at: new Date(now),
      });
    } catch (error) {
      console.error('Database error:', error);
      return 'Failed to create post.';
    }
  }
  revalidatePath('/dashboard/posts');
  redirect(`/blog/posts/${slug}`);
}
// ---------- Update Post ----------
export async function updatePost(
  postId: string,
  prevState: string | undefined,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 'Unauthorized';
  const isUserAdmin = session.user.role === 'admin';
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  if (!validatedFields.success) {
    return validatedFields.error.flatten().formErrors.join(', ');
  }
  const { title, content } = validatedFields.data;
  const images = formData.getAll('images') as string[];
  const slug = generateSlug(title);
  const now = new Date().toISOString();
  if (dbType === 'postgres') {
    try {
      const post = await sql<Pick<Post, 'user_id'>[]>`
        SELECT user_id FROM posts WHERE slug = ${postId}
      `;
      if (post.length === 0) return 'Post not found';
      if (!isUserAdmin && post[0].user_id !== session.user.id) {
        return 'You do not have permission to edit this post.';
      }
      await sql`
        UPDATE posts
        SET title = ${title}, content = ${content}, slug = ${slug}, images = ${images}, updated_at = ${now}
        WHERE slug = ${postId}
      `;
    } catch (error) {
      console.error('Database error:', error);
      return 'Failed to update post.';
    }
  } else {
    try {
      await connectDB();
      const post = await dataModels.Post.findOne({ slug: postId }).lean();
      if (!post) return 'Post not found';
      if (!isUserAdmin && post.user_id.toString() !== session.user.id) {
        return 'You do not have permission to edit this post.';
      }
      await dataModels.Post.updateOne(
        { slug: postId },
        {
          $set: {
            title,
            content,
            slug,
            images,
            updated_at: new Date(now),
          }
        }
      );
    } catch (error) {
      console.error('Database error:', error);
      return 'Failed to update post.';
    }
  }
  revalidatePath('/dashboard/posts');
  redirect('/dashboard/posts');
}
// ---------- Delete Post ----------
export async function deletePost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized');
  const isUserAdmin = session.user.role === 'admin';
  if (dbType === 'postgres') {
    try {
      const post = await sql`SELECT user_id FROM posts WHERE slug = ${postId}`;
      if (post.length === 0) throw new Error('Post not found');
      if (!isUserAdmin && post[0].user_id !== session.user.id) {
        throw new Error('Permission denied');
      }
      await sql`DELETE FROM posts WHERE slug = ${postId}`;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete post.', { cause: error });
    }
  } else {
    try {
      await connectDB();
      const post = await dataModels.Post.findOne({ slug: postId }).lean();
      if (!post) throw new Error('Post not found');
      if (!isUserAdmin && post.user_id.toString() !== session.user.id) {
        throw new Error('Permission denied');
      }
      await dataModels.Post.deleteOne({ slug: postId });
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete post.', { cause: error });
    }
  }
  revalidatePath('/dashboard/posts');
  redirect('/dashboard/posts');
}
// --- Comment Schemas ---
const CommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
    parentId: z.string().nullable().optional(),
});
export type AddCommentState = {
    error?: string;
    success?: boolean;
} | null;
// --- Add Comment ---
export async function addComment(postSlug: string, prevState: any, formData: FormData): Promise<AddCommentState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'You must be logged in to comment.' };
    }
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string | null;
    const validation = CommentSchema.safeParse({ content, parentId });
    if (!validation.success) {
        return { error: validation.error.flatten().formErrors.join(', ') };
    }
    const now = new Date();
    try {
        if (dbType === 'postgres') {
            await sql`
                INSERT INTO comments (post_slug, user_id, parent_id, content, created_at, updated_at)
                VALUES (${postSlug}, ${session.user.id}, ${parentId || null}, ${content}, ${now}, ${now})
            `;
        } else {
            await connectDB();
            await dataModels.Comment.create({
                post_slug: postSlug,
                user_id: session.user.id,
                parent_id: parentId || null,
                content,
                created_at: now,
                updated_at: now,
            });
        }
        revalidatePath(`/blog/posts/${postSlug}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to add comment:', error);
        return { error: 'Failed to add comment. Please try again.' };
    }
}

// ===================== Delete Comment =====================
// ===================== Delete Comment =====================
export async function deleteComment(commentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('Unauthorized');

    const isAdmin = session.user.role === 'admin';
    let postSlug: string;

    if (dbType === 'postgres') {
        // Fetch comment data before deletion
        const commentRows = await sql<{ user_id: string; post_slug: string }[]>`
            SELECT user_id, post_slug FROM comments WHERE id = ${commentId}
        `;
        if (commentRows.length === 0) throw new Error('Comment not found');
        const { user_id, post_slug: slug } = commentRows[0];
        if (!isAdmin && user_id !== session.user.id) {
            throw new Error('You do not have permission to delete this comment');
        }
        postSlug = slug;
        // Delete (cascade will delete replies)
        await sql`DELETE FROM comments WHERE id = ${commentId}`;
    } else {
        await connectDB();
        const comment = await dataModels.Comment.findById(commentId).lean();
        if (!comment) throw new Error('Comment not found');
        if (!isAdmin && comment.user_id.toString() !== session.user.id) {
            throw new Error('You do not have permission to delete this comment');
        }
        postSlug = comment.post_slug;
        await dataModels.Comment.deleteOne({ _id: commentId });
    }
    revalidatePath(`/blog/posts/${postSlug}`);
    return { success: true };
}

// ===================== Toggle Post Reaction =====================
export async function togglePostReaction(postSlug: string, reactionType: 'like' | 'dislike') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('Unauthorized');

    if (dbType === 'postgres') {
        // Check existing reaction
        const existing = await sql<{ reaction_type: string }[]>`
            SELECT reaction_type FROM post_reactions
            WHERE post_slug = ${postSlug} AND user_id = ${session.user.id}
        `;

        if (existing.length === 0) {
            // Insert new
            await sql`
                INSERT INTO post_reactions (post_slug, user_id, reaction_type)
                VALUES (${postSlug}, ${session.user.id}, ${reactionType})
            `;
        } else if (existing[0].reaction_type !== reactionType) {
            // Update to new type
            await sql`
                UPDATE post_reactions
                SET reaction_type = ${reactionType}, updated_at = NOW()
                WHERE post_slug = ${postSlug} AND user_id = ${session.user.id}
            `;
        } else {
            // Remove reaction (toggle off)
            await sql`
                DELETE FROM post_reactions
                WHERE post_slug = ${postSlug} AND user_id = ${session.user.id}
            `;
        }
    } else {
        await connectDB();
        const existing = await dataModels.PostReaction.findOne({
            post_slug: postSlug,
            user_id: session.user.id,
        }).lean();

        if (!existing) {
            await dataModels.PostReaction.create({
                post_slug: postSlug,
                user_id: session.user.id,
                reaction_type: reactionType,
            });
        } else if (existing.reaction_type !== reactionType) {
            await dataModels.PostReaction.updateOne(
                { _id: existing._id },
                { $set: { reaction_type: reactionType, updated_at: new Date() } }
            );
        } else {
            await dataModels.PostReaction.deleteOne({ _id: existing._id });
        }
    }
    revalidatePath(`/blog/posts/${postSlug}`);
    return { success: true };
}

// ===================== Toggle Comment Reaction =====================
export async function toggleCommentReaction(commentId: string, emoji: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('Unauthorized');

    if (dbType === 'postgres') {
        const existing = await sql<{ emoji: string }[]>`
            SELECT emoji FROM comment_reactions
            WHERE comment_id = ${commentId} AND user_id = ${session.user.id}
        `;

        if (existing.length === 0) {
            await sql`
                INSERT INTO comment_reactions (comment_id, user_id, emoji)
                VALUES (${commentId}, ${session.user.id}, ${emoji})
            `;
        } else if (existing[0].emoji === emoji) {
            await sql`
                DELETE FROM comment_reactions
                WHERE comment_id = ${commentId} AND user_id = ${session.user.id}
            `;
        } else {
            await sql`
                UPDATE comment_reactions
                SET emoji = ${emoji}, updated_at = NOW()
                WHERE comment_id = ${commentId} AND user_id = ${session.user.id}
            `;
        }
    } else {
        await connectDB();
        const existing = await dataModels.CommentReaction.findOne({
            comment_id: commentId,
            user_id: session.user.id,
        }).lean();

        if (!existing) {
            await dataModels.CommentReaction.create({
                comment_id: commentId,
                user_id: session.user.id,
                emoji,
            });
        } else if (existing.emoji === emoji) {
            await dataModels.CommentReaction.deleteOne({ _id: existing._id });
        } else {
            await dataModels.CommentReaction.updateOne(
                { _id: existing._id },
                { $set: { emoji, updated_at: new Date() } }
            );
        }
    }

    const comment = await (dbType === 'postgres'
        ? sql<{ post_slug: string }[]>`SELECT post_slug FROM comments WHERE id = ${commentId}`
        : dataModels.Comment.findById(commentId).select('post_slug').lean());
    const postSlug = (comment as any)[0]?.post_slug || (comment as any)?.post_slug;
    if (postSlug) revalidatePath(`/blog/posts/${postSlug}`);
    return { success: true };
}
// ---------- Signup (unified token system) ----------
const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
// ---------- sign up ----------
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
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 Hashed password length:', hashedPassword.length);
  let token: string; // Declare token here, to be used in both branches and after
  if (dbType === 'postgres') {
    // PostgreSQL logic
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
    try {
      await sql`
        INSERT INTO users (name, email, password, email_verified, email_verified_at, image, created_at, updated_at)
        VALUES (${name}, ${email}, ${hashedPassword}, FALSE, NULL, NULL, NOW(), NOW())
      `;
    // Insert user and RETURN the generated id
      // const [newUser] = await sql`
      //   INSERT INTO users (name, email, password, email_verified, image)
      //   VALUES (${name}, ${email}, ${hashedPassword}, FALSE, NULL)
      //   RETURNING id
      // `;
      //const userId = newUser.id;
      console.log('User inserted successfully:', email);
      // Link to existing customer by email
      await sql`
        UPDATE customers
        SET user_id = (SELECT id FROM users WHERE email = ${email}),
            image_url = COALESCE((SELECT image FROM users WHERE email = ${email}), image_url)
        WHERE email = ${email}
      `;
      // Link to existing customer by email
      // await sql`
      //   UPDATE customers
      //   SET user_id = ${userId},
      //       image_url = COALESCE((SELECT image FROM users WHERE id = ${userId}), image_url)
      //   WHERE email = ${email}
      // `;
      // Generate token after user creation to ensure we have the user ID for the token insertion
      token = randomBytes(32).toString('hex'); // assign token
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      // Insert verification code using the returned user id
      // Use unified verification_codes table (old project style)
      await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES ((SELECT id FROM users WHERE email = ${email}), ${token}, ${expires})
      `;
      // await sql`
      //   INSERT INTO verification_tokens (identifier, token, expires)
      //   VALUES (${userId}, ${token}, ${expires})
      // `;
      console.log('Verification token inserted for:', email);
    } catch (error) {
      console.error('Database error inserting user:', error);
      return 'Failed to create account. Please try again.';
    }
  } else {
    // MongoDB logic
    await connectDB();
    try {
      const existingUser = await dataModels.User.findOne({ email }).lean();
      if (existingUser) {
        console.log('User already exists:', email);
        return 'User with this email already exists.';
      }
    } catch (error) {
      console.error('Database error checking existing user:', error);
      return 'Something went wrong. Please try again.';
    }
    try {
      const newUser = await dataModels.User.create({
        name,
        email,
        password: hashedPassword,
        email_verified: false,
        emailVerifiedAt: null,
        image: null,
      });
      // userId = newUser._id.toString();
      console.log('User inserted successfully:', email);
      await dataModels.Customer.updateMany(
        { email },
        {
          $set: {
            user_id: newUser._id,
            image_url: newUser.image || '',
          }
        }
      );
    } catch (error) {
      console.error('Database error inserting user:', error);
      return 'Failed to create account. Please try again.';
    }
    token = randomBytes(32).toString('hex'); // assign token
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      const user = await dataModels.User.findOne({ email }).lean();
      if (user) {
        await dataModels.Verification_Token.create({
          identifier: user._id,
          token,
          expires,
        });
        console.log('Verification token inserted for:', email);
      }
    } catch (error) {
      console.error('Database error inserting token:', error);
      return 'Failed to create account. Please try again.';
    }
  }
  // Send verification email (fire and forget) – token is now defined
  console.log('📧 Attempting to send verification email to:', email);
  try {
    await sendVerificationEmail(email, token);
    console.log('✅ Verification email sent successfully');
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
  }
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  console.log('🔗 Verification link (copy and paste in browser):', verificationUrl);
  redirect('/user/login?registered=1');
}
// ---------- Update Profile ----------
export async function updateProfile(prevState: string | undefined, formData: FormData) {
  import('server-only');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 'Unauthorized';
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const image = formData.get('image') as string;
  const phone = formData.get('phone') as string || null;
  const city = formData.get('city') as string || null;
  const about = formData.get('about') as string || null;
  const birth_date = formData.get('birth_date') as string || null;
  if (!name || !email) return 'Name and email are required';
  if (dbType === 'postgres') {
    try {
      if (email !== session.user.email) {
        const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) return 'Email already in use';
      }
      // Update user – only fields that exist in the unified table
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
      const linkedCustomers = await sql<{ id: string }[]>`
        SELECT id FROM customers WHERE user_id = ${session.user.id}
      `;
      // Update linked customer image
      if (linkedCustomers.length > 0) {
        await sql`
          UPDATE customers
          SET image_url = ${image || ''}
          WHERE user_id = ${session.user.id}
        `;
      }
      // Handle email change verification
      if (email !== session.user.email) {
        await sql`UPDATE users SET email_verified = FALSE, email_verified_at = NULL WHERE id = ${session.user.id}`;
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await sql`
          INSERT INTO verification_tokens (identifier, token, expires)
          VALUES (${session.user.id}, ${token}, ${expires})
        `;
        sendVerificationEmail(email, token).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      return 'Failed to update profile';
    }
  } else {
    try {
      await connectDB();
      if (email !== session.user.email) {
        const existing = await dataModels.User.findOne({ email }).lean();
        if (existing) return 'Email already in use';
      }
      await dataModels.User.updateOne(
        { _id: session.user.id },
        {
          $set: {
            name,
            email,
            image: image || undefined,
            phone,
            city,
            about,
            birth_date: birth_date ? new Date(birth_date) : undefined,
            updated_at: new Date(),
          }
        }
      );
      const linkedCustomers = await dataModels.Customer.find({ user_id: session.user.id }).lean();
      if (linkedCustomers.length > 0) {
        await dataModels.Customer.updateMany(
          { user_id: session.user.id },
          { $set: { image_url: image || '' } }
        );
      }
      if (email !== session.user.email) {
        await dataModels.User.updateOne(
          { _id: session.user.id },
          { $set: { email_verified: false, emailVerifiedAt: null } }
        );
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await dataModels.Verification_Token.create({
          user_id: session.user.id,
          token,
          expires,
        });
        sendVerificationEmail(email, token).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      return 'Failed to update profile';
    }
  }
  revalidatePath('/dashboard/profiles');
  return 'Profile updated successfully';
}
// ---------- Sign Out ----------
export async function signOutAction() {
  //const { signOut } = await import('@/auth');
  //await signOut({ redirectTo: '/' });
  redirect('/auth/signout');
}
async function ensureProductsDir() {
  const dir = path.join(process.cwd(), 'public/products');
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    console.error('Failed to create products directory:', err);
  }
}
export async function createProduct(formData: FormData) {
  try {
    // const session = await auth();
    const session = await getServerSession(authOptions);
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
    if (dbType === 'postgres') {
      const result = await (sql<Product[]>`
        INSERT INTO products (name, price, image, type)
        VALUES (${name}, ${price}, ${filename}, ${type})
        RETURNING *
      ` as unknown as Promise<Product[]>);
      const product = result[0];
      if (!product) throw new Error('Insert failed');
      revalidatePath('/store/edit');
      return product;
    } else {
      await connectDB();
      const product = await dataModels.Product.create({
        name,
        price,
        image: filename,
        type,
      });
      revalidatePath('/store/edit');
      // Convert to plain object and add id field
      return {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        type: product.type,
      };
    }
  } catch (error) {
      console.error('❌ Error Creating the Product:', error);
  }
}
export async function updateProduct(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const type = formData.get('type') as string;
    const imageFile = formData.get('image') as File | null;
    let filename: string | null = null;
    if (imageFile && imageFile.size > 0) {
      await ensureProductsDir();
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      filename = `${Date.now()}-${imageFile.name}`;
      const filepath = path.join(process.cwd(), 'public/products', filename);
      await writeFile(filepath, buffer);
    }
    if (dbType === 'postgres') {
      const result = await sql<Product[]>`
        UPDATE products
        SET name = ${name}, price = ${price}, type = ${type}, image = COALESCE(${filename}, image)
        WHERE id = ${id}
        RETURNING *
      `;
      const product = result[0];
      if (!product) throw new Error('Product not found or update failed');
      revalidatePath('/store/edit');
      return product;
    } else {
      await connectDB();
      const updateData: any = { name, price, type };
      if (filename) updateData.image = filename;
      const product = await dataModels.Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, lean: true }
      );
      if (!product) throw new Error('Product not found');
      revalidatePath('/store/edit');
      return {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        type: product.type,
      };
    }
  } catch (error) {
    console.error('❌ Error Updating the Product:', error);
  }  
}
export async function deleteProduct(id: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
  try {
    if (dbType === 'postgres') {
    await sql`DELETE FROM products WHERE id = ${id}`;
  } else {
    await connectDB();
    await dataModels.Product.findByIdAndDelete(id);
  }
  revalidatePath('/store/edit');
  } catch (error) {
    console.error('❌ Error deleting the Product:', error);
  }
}
// ---------- Create Store Invoice ----------
export async function createStoreInvoice(formData: FormData) {
  const session = await getServerSession(authOptions);
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
  if (!productId || !name || !email || !address || !city || !postalCode || !country) {
    return { error: 'All fields are required' };
  }
  const product = await getProductById(parseInt(productId));
  if (!product) return { error: 'Product not found' };
  const totalAmount = Math.round(product.price * quantity * 100); // in cents
  const status = paymentMethod === 'bank_transfer' ? 'pending' : 'paid';
  const date = new Date().toISOString().split('T')[0];
  const items = [{ productId: product.id, name: product.name, price: product.price, quantity }];
  const shippingInfo = { name, address, city, postalCode, country };
  let invoiceId: string;
  if (dbType === 'postgres') {
    // Find or create customer
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
    invoiceId = invoice[0].id;
  } else {
    await connectDB();
    // Find or create customer
    let customer = await dataModels.Customer.findOne({ email }).lean();
    if (customer) {
      if (session?.user?.id) {
        await dataModels.Customer.updateOne(
          { _id: customer._id },
          {
            $set: {
              user_id: session.user.id,
              image_url: session.user.image || customer.image_url,
            }
          }
        );
      }
    } else {
      const imageUrl = session?.user?.image || '';
      const newCustomer = await dataModels.Customer.create({
        name,
        email,
        image_url: imageUrl,
        user_id: session?.user?.id || null,
      });
      customer = newCustomer.toObject();
    }
    const newInvoice = await dataModels.Invoice.create({
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
      },
      amount: totalAmount,
      status,
      date,
      items,
      shipping_info: shippingInfo,
      payment_intent_id: paymentIntentId,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
    });
    invoiceId = newInvoice._id.toString();
  }

  const htmlEmail = `<h1>Thank you for your purchase!</h1>
  <p>Product: ${product.name} x ${quantity}</p>
  <p>Total: $${(totalAmount/100).toFixed(2)}</p>
  <p>Invoice ID: ${invoiceId}</p>`;
  await sendEmail([{ Email: email }], 'Purchase Confirmation', htmlEmail);
  // Send confirmation email (fire and forget)
  // import('./email').then(({ sendPurchaseConfirmation }) => {
  //   sendPurchaseConfirmation(email, { product, quantity, total: totalAmount / 100, invoiceId }).catch(console.error);
  // });
  if (paymentMethod === 'bank_transfer') {
    return { invoiceId, message: 'Order placed. Please complete bank transfer.' };
  } else {
    redirect(`/store/checkout/success?invoiceId=${invoiceId}`);
  }
}

// ---------- Contact Form ----------
const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(2, 'Message must be at least 2 characters'),
});

// export async function sendContactMessage(prevState: string | undefined, formData: FormData) {
//   //console.log('🔵 sendContactMessage started');
//   //console.log('FormData entries:', Array.from(formData.entries()));
//   const validatedFields = ContactSchema.safeParse({
//     name: formData.get('name'),
//     email: formData.get('email'),
//     message: formData.get('message'),
//   });
//   console.log('Validation result:', validatedFields);
//   if (!validatedFields.success) {
//     console.log('❌ Validation failed:', validatedFields.error.flatten());
//     return validatedFields.error.flatten().formErrors.join(', ');
//   }
//   const { name, email, message } = validatedFields.data;
//   console.log('✅ Validation passed:', { name, email, messageLength: message.length });
//   try {
//     console.log('📧 Calling sendContactEmails...');
//     await sendContactEmails(name, email, message);
//     // Email to admin
//     console.log('✅ Emails sent successfully');
//   } catch (error) {
//     console.error('❌ Error sending contact emails:', error);
//     return 'Failed to send message. Please try again later.';
//   }
//   console.log('🔄 Redirecting to thank-you page');
//   redirect('/contact/thank-you');
// }
export async function sendContactMessage(prevState: string | undefined, formData: FormData) {
  const validatedFields = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });
  if (!validatedFields.success) {
    return validatedFields.error.flatten().formErrors.join(', ');
  }

  const { name, email, message } = validatedFields.data;

  try {
    // Email to admin (you)
    await sendEmail(
      [{ Email: process.env.MAIL_SENDER_EMAIL! }],
      `New contact message from ${name}`,
      `<p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
    );

    // Confirmation email to user
    await sendEmail(
      [{ Email: email }],
      'Thank you for contacting us',
      `<p>Dear ${name},</p>
       <p>We have received your message and will get back to you as soon as possible.</p>
       <p>Here is a copy of your message:</p>
       <blockquote>${message.replace(/\n/g, '<br/>')}</blockquote>
       <p>Best regards,<br/>GoBye Team</p>`
    );
  } catch (error) {
    console.error('Failed to send contact emails:', error);
    return 'Failed to send message. Please try again later.';
  }

  redirect('/contact/thank-you');
}