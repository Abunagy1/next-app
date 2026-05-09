//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import RevenueModel from '@/app/lib/db/models/Revenue';
import InvoiceModel from '@/app/lib/db/models/Invoice';
import CustomerModel from '@/app/lib/db/models/Customer';
import PostModel from '@/app/lib/db/models/Post';
import dataModels from '@/app/lib/db/models';
import ProductModel from '@/app/lib/db/models/Product';
import CommentModel from '@/app/lib/db/models/Comment';
// ... (existing imports) ...
import PostReactionModel from '@/app/lib/db/models/PostReaction';
import CommentReactionModel from '@/app/lib/db/models/CommentReaction';
// Fetch latest invoices – optionally filtered by user's customer IDs
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
  Post,
  Revenue,
  Product,
  User,
} from './definitions';
import { formatCurrency } from './utils';
import { any } from 'zod';
const ITEMS_PER_PAGE = 6;
// -----------------------------------------------------------------------------
// Revenue
// -----------------------------------------------------------------------------
export async function fetchRevenue(): Promise<Revenue[]> {
  if (dbType === 'postgres') {
    try {
      return await sql<Revenue[]>`SELECT * FROM revenue`;
    } catch (error) {
      console.error('PostgreSQL Error:', error);
      throw new Error('Failed to fetch revenue data.', { cause: error });
    }
  } else {
    try {
      await connectDB();
      const docs = await RevenueModel.find().lean();
      return docs.map(doc => ({
        month: doc.month,
        revenue: doc.revenue,
      }));
    } catch (error) {
      console.error('MongoDB Error:', error);
      throw new Error('Failed to fetch revenue data.', { cause: error });
    }
  }
}
// -----------------------------------------------------------------------------
// User by ID
// -----------------------------------------------------------------------------
export async function getUserById(userId: string): Promise<Pick<User, 'name' | 'image'> | null> {
  if (dbType === 'postgres') {
    try {
      const users = await sql<Pick<User, 'name' | 'image'>[]>`
        SELECT name, image FROM users WHERE id = ${userId}
      `;
      return users[0] || null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  } else {
    await connectDB();
    const user = await dataModels.User.findById(userId).lean();
    if (!user) return null;
    return {
      name: user.name,
      image: user.image,
    };
  }
}
// -----------------------------------------------------------------------------
// Latest Invoices
// -----------------------------------------------------------------------------
// Type for the raw database row (amount is number)
type RawLatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: number;
};
export async function fetchLatestInvoices(userCustomerIds?: string[]): Promise<LatestInvoice[]> {
  if (dbType === 'postgres') {
    try {
      let data: RawLatestInvoice[];
      if (userCustomerIds && userCustomerIds.length > 0) {
        // Filtered by user's customers
        data = await sql<RawLatestInvoice[]>`
          SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
          FROM invoices
          JOIN customers ON invoices.customer_id = customers.id
          WHERE customers.id = ANY(${userCustomerIds})
          ORDER BY invoices.date DESC
          LIMIT 5
        `;
      } else if (userCustomerIds && userCustomerIds.length === 0) {
        // User has no linked customers – no invoices to show
        return [];
      } else {
        // Admin (no userCustomerIds) – all invoices
        data = await sql<RawLatestInvoice[]>`
          SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
          FROM invoices
          JOIN customers ON invoices.customer_id = customers.id
          ORDER BY invoices.date DESC
          LIMIT 5
        `;
      }
      const latestInvoices = data.map((invoice) => ({
        id: invoice.id,
        name: invoice.name,
        image_url: invoice.image_url,
        email: invoice.email,
        amount: formatCurrency(invoice.amount),
      }));
      return latestInvoices;
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch the latest invoices.', { cause: error });
    }
  } else {
      await connectDB();
      let query = InvoiceModel.find().sort('-date').limit(5);
      if (userCustomerIds && userCustomerIds.length > 0) {
        // userCustomerIds are customer _ids as strings
        query = query.where('customer.id').in(userCustomerIds);
      } else if (userCustomerIds && userCustomerIds.length === 0) {
        return [];
      }
      const invoices = await query.lean();
      return invoices.map(inv => ({
        id: inv._id.toString(),
        name: inv.customer.name,
        image_url: inv.customer.image_url,
        email: inv.customer.email,
        amount: formatCurrency(inv.amount),
      }
    ));
  }
}
// -----------------------------------------------------------------------------
// User Invoice Stats
// -----------------------------------------------------------------------------
// Fetch invoice stats for a regular user (based on their customer IDs)
export async function fetchUserInvoiceStats(userCustomerIds: string[]) {
  if (dbType === 'postgres') {
    try {
      if (userCustomerIds.length === 0) {
        return { numberOfInvoices: 0, totalPaid: '$0.00', totalPending: '$0.00' };
      }
      const data = await sql`
        SELECT 
          COUNT(*) as count,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
        FROM invoices
        WHERE customer_id = ANY(${userCustomerIds})
      `;
      const row = data[0];
      return {
        numberOfInvoices: Number(row.count) || 0,
        totalPaid: formatCurrency(row.paid || 0),
        totalPending: formatCurrency(row.pending || 0),
      };
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch user invoice stats.', { cause: error });
    }
  } else {
    await connectDB();
    if (userCustomerIds.length === 0) {
      return { numberOfInvoices: 0, totalPaid: '$0.00', totalPending: '$0.00' };
    }
    const result = await InvoiceModel.aggregate([
      { $match: { 'customer.id': { $in: userCustomerIds } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        }
      }
    ]);
    if (result.length === 0) {
      return { numberOfInvoices: 0, totalPaid: '$0.00', totalPending: '$0.00' };
    }
    const { count, paid, pending } = result[0];
    return {
      numberOfInvoices: count,
      totalPaid: formatCurrency(paid),
      totalPending: formatCurrency(pending),
    };
  }
}
// -----------------------------------------------------------------------------
// Card Data (admin dashboard)
// -----------------------------------------------------------------------------
//In JavaScript, you can use the Promise.all() or Promise.allSettled() functions to initiate all promises at the same time.
// For example, in data.ts, we're using Promise.all() in the fetchCardData() function for Parallel data fetching to avoid waterfalls:
export async function fetchCardData() {
  if (dbType === 'postgres') {
    try {
      // You can probably combine these into a single SQL query
      // However, we are intentionally splitting them to demonstrate
      // how to initialize multiple queries in parallel with JS.
      const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
      const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
      const invoiceStatusPromise = sql`
        SELECT
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
        FROM invoices
      `;
      const data = await Promise.all([
        invoiceCountPromise,
        customerCountPromise,
        invoiceStatusPromise,
      ]);
      const numberOfInvoices = Number(data[0][0].count ?? '0');
      const numberOfCustomers = Number(data[1][0].count ?? '0');
      const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
      const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');
      return {
        numberOfCustomers,
        numberOfInvoices,
        totalPaidInvoices,
        totalPendingInvoices,
      };
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch card data.', { cause: error });
    }
  } else {
    await connectDB();
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      InvoiceModel.countDocuments(),
      CustomerModel.countDocuments(),
      InvoiceModel.aggregate([
        {
          $group: {
            _id: null,
            paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          }
        }
      ])
    ]);
    const status = invoiceStatus[0] || { paid: 0, pending: 0 };
    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: formatCurrency(status.paid),
      totalPendingInvoices: formatCurrency(status.pending),
    };
  }
}
// -----------------------------------------------------------------------------
// Filtered Invoices (with search & pagination)
// -----------------------------------------------------------------------------
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  userCustomerIds?: string[],
  isAdmin?: boolean
) : Promise<InvoicesTable[]>{
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  if (dbType === 'postgres') {
    try {
      const baseQuery = sql`
        SELECT
          invoices.id,
          invoices.amount,
          invoices.date,
          invoices.status,
          customers.name,
          customers.email,
          customers.image_url
        FROM invoices
        JOIN customers ON invoices.customer_id = customers.id
      `;
      let whereClause;
      if (isAdmin) {
        whereClause = sql`
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
            customers.email ILIKE ${`%${query}%`} OR
            invoices.amount::text ILIKE ${`%${query}%`} OR
            invoices.date::text ILIKE ${`%${query}%`} OR
            invoices.status ILIKE ${`%${query}%`}
        `;
      } else if (userCustomerIds && userCustomerIds.length > 0) {
        whereClause = sql`
          WHERE customers.id = ANY(${userCustomerIds})
            AND (
              customers.name ILIKE ${`%${query}%`} OR
              customers.email ILIKE ${`%${query}%`} OR
              invoices.amount::text ILIKE ${`%${query}%`} OR
              invoices.date::text ILIKE ${`%${query}%`} OR
              invoices.status ILIKE ${`%${query}%`}
            )
        `;
      } else {
        whereClause = sql`WHERE 1=0`; // No customers for user
      }
      const invoices = await sql<InvoicesTable[]>`
        ${baseQuery}
        ${whereClause}
        ORDER BY invoices.date DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
      return invoices;
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch invoices.', { cause: error });
    }
  } else {
    await connectDB();
    // Build MongoDB query
    const filter: any = {};
    if (!isAdmin && userCustomerIds && userCustomerIds.length > 0) {
      filter['customer.id'] = { $in: userCustomerIds };
    } else if (!isAdmin && (!userCustomerIds || userCustomerIds.length === 0)) {
      return []; // no customers for user
    }
    // If there's a search query, add search conditions
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex },
        { amount: isNaN(Number(query)) ? undefined : Number(query) }, // exact match on amount
        { status: searchRegex },
        // date search is tricky; we'll skip date search for simplicity or implement via $expr
      ];
      // amount exact match if query is numeric
      // if (!isNaN(Number(query))) {
      //   filter.$or.push({ amount: Number(query) });
      // }
      // Remove undefined conditions
      filter.$or = filter.$or.filter((cond: any) => cond !== undefined);
      // date search is not implemented here for simplicity
    }
    const invoices = await InvoiceModel.find(filter)
      .sort('-date')
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .lean();
    return invoices.map(inv => ({
      id: inv._id.toString(),
      customer_id: inv.customer.id.toString(),
      name: inv.customer.name,
      email: inv.customer.email,
      image_url: inv.customer.image_url,
      date: inv.date.toISOString().split('T')[0],
      amount: inv.amount,
      status: inv.status,
    }));
  }
}
// -----------------------------------------------------------------------------
// Invoices Pages Count
// -----------------------------------------------------------------------------
export async function fetchInvoicesPages(query: string, userCustomerIds?: string[], isAdmin?: boolean) {
  if (dbType === 'postgres') {
    try {
      let whereClause;
      if (isAdmin) {
        whereClause = sql`
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
            customers.email ILIKE ${`%${query}%`} OR
            invoices.amount::text ILIKE ${`%${query}%`} OR
            invoices.date::text ILIKE ${`%${query}%`} OR
            invoices.status ILIKE ${`%${query}%`}
        `;
      } else if (userCustomerIds && userCustomerIds.length > 0) {
        whereClause = sql`
          WHERE customers.id = ANY(${userCustomerIds})
            AND (
              customers.name ILIKE ${`%${query}%`} OR
              customers.email ILIKE ${`%${query}%`} OR
              invoices.amount::text ILIKE ${`%${query}%`} OR
              invoices.date::text ILIKE ${`%${query}%`} OR
              invoices.status ILIKE ${`%${query}%`}
            )
        `;
      } else {
        whereClause = sql`WHERE 1=0`;
      }
      const data = await sql`
        SELECT COUNT(*)
        FROM invoices
        JOIN customers ON invoices.customer_id = customers.id
        ${whereClause}
      `;
      return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch total number of invoices.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (!isAdmin && userCustomerIds && userCustomerIds.length > 0) {
      filter['customer.id'] = { $in: userCustomerIds };
    } else if (!isAdmin && (!userCustomerIds || userCustomerIds.length === 0)) {
      return 0;
    }
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex },
        { status: searchRegex },
      ];
      if (!isNaN(Number(query))) {
        filter.$or.push({ amount: Number(query) });
      }
    }
    const count = await InvoiceModel.countDocuments(filter);
    return Math.ceil(count / ITEMS_PER_PAGE);
  }
}
// -----------------------------------------------------------------------------
// Invoice by ID
// -----------------------------------------------------------------------------
export async function fetchInvoiceById(id: string): Promise<InvoiceForm | undefined> {
    if (dbType === 'postgres') {
    try {
      const data = await sql<InvoiceForm[]>`
        SELECT
          invoices.id,
          invoices.customer_id,
          invoices.amount,
          invoices.status
        FROM invoices
        WHERE invoices.id = ${id};
      `;
      const invoice = data.map((inv: any) => ({
        ...inv,
        // Convert amount from cents to dollars
        amount: inv.amount / 100,
      }));
      //console.log(invoice); // Invoice is an empty array []
      return invoice[0];
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch invoice.', { cause: error });
    }
  } else {
    await connectDB();
    const inv = await InvoiceModel.findById(id).lean();
    if (!inv) return undefined;
    return {
      id: inv._id.toString(),
      customer_id: inv.customer.id.toString(),
      amount: inv.amount / 100,
      status: inv.status,
    };
  }
}
// -----------------------------------------------------------------------------
// All Customers (for dropdown)
// -----------------------------------------------------------------------------
export async function fetchCustomers(): Promise<CustomerField[]> {
  if (dbType === 'postgres') {
    try {
      const customers = await sql<CustomerField[]>`
        SELECT
          id,
          name
        FROM customers
        ORDER BY name ASC
      `;
      return customers;
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch all customers.', { cause: err });
    }
  } else {
    await connectDB();
    const customers = await CustomerModel.find().sort('name').lean();
    return customers.map(c => ({
      id: c._id.toString(),
      name: c.name,
    }));
  }
}
// -----------------------------------------------------------------------------
// Customers Pages Count
// -----------------------------------------------------------------------------
export async function fetchCustomersPages(
  query: string,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<number> {
  if (dbType === 'postgres') {
    try {
      let whereClause;
      if (isAdmin) {
        whereClause = sql`
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
            customers.email ILIKE ${`%${query}%`}
        `;
      } else if (userCustomerIds && userCustomerIds.length > 0) {
        whereClause = sql`
          WHERE customers.id = ANY(${userCustomerIds})
            AND (
              customers.name ILIKE ${`%${query}%`} OR
              customers.email ILIKE ${`%${query}%`}
            )
        `;
      } else {
        return 0;
      }
      const countResult = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count
        FROM customers
        ${whereClause}
      `;
      return Math.ceil(Number(countResult[0].count) / ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch customers pages.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (isAdmin) {
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else if (userCustomerIds && userCustomerIds.length > 0) {
      filter._id = { $in: userCustomerIds };
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else {
      return 0;
    }
    const count = await CustomerModel.countDocuments(filter);
    return Math.ceil(count / ITEMS_PER_PAGE);
  }
}
// -----------------------------------------------------------------------------
// Filtered Customers for User (raw numbers)
// -----------------------------------------------------------------------------
export async function fetchFilteredCustomersForUser(
  query: string,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<CustomersTableType[]> {
  if (dbType === 'postgres') {
    try {
      let whereClause;
      if (isAdmin) {
        whereClause = sql`
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
            customers.email ILIKE ${`%${query}%`}
        `;
      } else if (userCustomerIds && userCustomerIds.length > 0) {
        whereClause = sql`
          WHERE customers.id = ANY(${userCustomerIds})
            AND (
              customers.name ILIKE ${`%${query}%`} OR
              customers.email ILIKE ${`%${query}%`}
            )
        `;
      } else {
        return [];
      }
      const data = await sql<CustomersTableType[]>`
        SELECT
          customers.id,
          customers.name,
          customers.email,
          customers.image_url,
          COUNT(invoices.id) AS total_invoices,
          SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
          SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
        FROM customers
        LEFT JOIN invoices ON customers.id = invoices.customer_id
        ${whereClause}
        GROUP BY customers.id, customers.name, customers.email, customers.image_url
        ORDER BY customers.name ASC
      `;
      return data;
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch customers.', { cause: err });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (isAdmin) {
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else if (userCustomerIds && userCustomerIds.length > 0) {
      filter._id = { $in: userCustomerIds };
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else {
      return [];
    }
    const customers = await CustomerModel.find(filter).sort('name').lean();
    // For each customer, we need invoice stats
    const customerIds = customers.map(c => c._id);
    const invoiceStats = await InvoiceModel.aggregate([
      { $match: { 'customer.id': { $in: customerIds } } },
      {
        $group: {
          _id: '$customer.id',
          total_invoices: { $sum: 1 },
          total_pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          total_paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
        }
      }
    ]);
    const statsMap = new Map();
    invoiceStats.forEach(stat => {
      statsMap.set(stat._id.toString(), stat);
    });
    return customers.map(c => {
      const stats = statsMap.get(c._id.toString()) || { total_invoices: 0, total_pending: 0, total_paid: 0 };
      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        image_url: c.image_url,
        total_invoices: stats.total_invoices,
        total_pending: stats.total_pending,
        total_paid: stats.total_paid,
      };
    });
  }
}
// -----------------------------------------------------------------------------
// Filtered Customers for User (paginated)
// -----------------------------------------------------------------------------
export async function fetchFilteredCustomersForUserPaginated(
  query: string,
  currentPage: number,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<CustomersTableType[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  if (dbType === 'postgres') {
    try {
      let whereClause;
      if (isAdmin) {
        whereClause = sql`
          WHERE
            customers.name ILIKE ${`%${query}%`} OR
            customers.email ILIKE ${`%${query}%`}
        `;
      } else if (userCustomerIds && userCustomerIds.length > 0) {
        whereClause = sql`
          WHERE customers.id = ANY(${userCustomerIds})
            AND (
              customers.name ILIKE ${`%${query}%`} OR
              customers.email ILIKE ${`%${query}%`}
            )
        `;
      } else {
        return [];
      }
      const data = await sql<CustomersTableType[]>`
        SELECT
          customers.id,
          customers.name,
          customers.email,
          customers.image_url,
          COUNT(invoices.id) AS total_invoices,
          SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
          SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
        FROM customers
        LEFT JOIN invoices ON customers.id = invoices.customer_id
        ${whereClause}
        GROUP BY customers.id, customers.name, customers.email, customers.image_url
        ORDER BY customers.name ASC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
      return data;
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch customers.', { cause: err });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (isAdmin) {
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else if (userCustomerIds && userCustomerIds.length > 0) {
      filter._id = { $in: userCustomerIds };
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }
    } else {
      return [];
    }
    const customers = await CustomerModel.find(filter)
      .sort('name')
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .lean();
    const customerIds = customers.map(c => c._id);
    const invoiceStats = await InvoiceModel.aggregate([
      { $match: { 'customer.id': { $in: customerIds } } },
      {
        $group: {
          _id: '$customer.id',
          total_invoices: { $sum: 1 },
          total_pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          total_paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
        }
      }
    ]);
    const statsMap = new Map();
    invoiceStats.forEach((stat: any) => {
      statsMap.set(stat._id.toString(), stat);
    });
    return customers.map(c => {
      const stats = statsMap.get(c._id.toString()) || { total_invoices: 0, total_pending: 0, total_paid: 0 };
      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        image_url: c.image_url,
        total_invoices: stats.total_invoices,
        total_pending: stats.total_pending,
        total_paid: stats.total_paid,
      };
    });
  }
}
// -----------------------------------------------------------------------------
// Product by ID
// -----------------------------------------------------------------------------
export async function getProductById(id: number): Promise<Product | undefined> {
  if (dbType === 'postgres') {
    try {
      const products = await sql<Product[]>`SELECT * FROM products WHERE id = ${id}`;
      return products[0];
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch product.', { cause: error });
    }
  } else {
    await connectDB();
    const product = await ProductModel.findById(id).lean();
    if (!product) return undefined;
    return {
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      type: product.type,
    };
  }
}
// -----------------------------------------------------------------------------
// User's Customer IDs
// -----------------------------------------------------------------------------
export async function getUserCustomerIds(userId: string): Promise<string[]> {
  if (dbType === 'postgres') {
    try {
      const customers = await sql<{ id: string }[]>`SELECT id FROM customers WHERE user_id = ${userId}`;
      return customers.map((c: { id: string }) => c.id);
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch cusomers.', { cause: error });
    }} else {
    await connectDB();
    const customers = await CustomerModel.find({ user_id: userId }).lean();
    return customers.map((c: { _id: string }) => c._id.toString());
  }
}
// -----------------------------------------------------------------------------
// Filtered Customers (admin, with formatting)
// -----------------------------------------------------------------------------
export async function fetchFilteredCustomers(query: string) {
  if (dbType === 'postgres') {
    try {
      const data = await sql<CustomersTableType[]>`
        SELECT
          customers.id,
          customers.name,
          customers.email,
          customers.image_url,
          COUNT(invoices.id) AS total_invoices,
          SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
          SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
        FROM customers
        LEFT JOIN invoices ON customers.id = invoices.customer_id
        WHERE
          customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`}
        GROUP BY customers.id, customers.name, customers.email, customers.image_url
        ORDER BY customers.name ASC
      `;
      return data.map((customer: any) => ({
        ...customer,
        total_pending: formatCurrency(customer.total_pending),
        total_paid: formatCurrency(customer.total_paid),
      }));
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch customer table.', { cause: err });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }
    const customers = await CustomerModel.find(filter).sort('name').lean();
    const customerIds = customers.map(c => c._id);
    const invoiceStats = await InvoiceModel.aggregate([
      { $match: { 'customer.id': { $in: customerIds } } },
      {
        $group: {
          _id: '$customer.id',
          total_invoices: { $sum: 1 },
          total_pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          total_paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
        }
      }
    ]);
    const statsMap = new Map();
    invoiceStats.forEach(stat => {
      statsMap.set(stat._id.toString(), stat);
    });
    return customers.map(c => {
      const stats = statsMap.get(c._id.toString()) || { total_invoices: 0, total_pending: 0, total_paid: 0 };
      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        image_url: c.image_url,
        total_invoices: stats.total_invoices,
        total_pending: formatCurrency(stats.total_pending),
        total_paid: formatCurrency(stats.total_paid),
      };
    });
  }
}
// -----------------------------------------------------------------------------
// Posts by User (filtered, paginated)
// -----------------------------------------------------------------------------
export async function fetchFilteredPostsByUser(
  userId: string,
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  if (dbType === 'postgres') {
    try {
      const posts = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at, images
        FROM posts
        WHERE user_id = ${userId} AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`})
        ORDER BY created_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
      return posts;
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch posts.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = { user_id: userId };
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }
    const posts = await PostModel.find(filter)
      .sort('-created_at')
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .lean();
    return posts.map(post => ({
      slug: post.slug,
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      images: post.images,
    }));
  }
}
// -----------------------------------------------------------------------------
// Posts Pages by User
// -----------------------------------------------------------------------------
export async function fetchPostsPagesByUser(userId: string, query: string) {
  if (dbType === 'postgres') {
    try {
      const data = await sql`
        SELECT COUNT(*)
        FROM posts
        WHERE user_id = ${userId} AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`})
      `;
      return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch total number of posts.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = { user_id: userId };
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }
    const count = await PostModel.countDocuments(filter);
    return Math.ceil(count / ITEMS_PER_PAGE);
  }
}
// -----------------------------------------------------------------------------
// Filtered Posts (admin, all users)
// -----------------------------------------------------------------------------
export async function fetchFilteredPosts(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  if (dbType === 'postgres') {
    try {
      const posts = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at
        FROM posts
        WHERE title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`}
        ORDER BY created_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
      return posts;
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch posts.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }
    const posts = await PostModel.find(filter)
      .sort('-created_at')
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .lean();
    return posts.map(post => ({
      slug: post.slug,
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    }));
  }
}
// -----------------------------------------------------------------------------
// Posts Pages (admin)
// -----------------------------------------------------------------------------
export async function fetchPostsPages(query: string) {
  if (dbType === 'postgres') {
    try {
      const data = await sql`SELECT COUNT(*)
        FROM posts
        WHERE title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`}
      `;
      return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch total number of posts.', { cause: error });
    }
  } else {
    await connectDB();
    const filter: any = {};
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }
    const count = await PostModel.countDocuments(filter);
    return Math.ceil(count / ITEMS_PER_PAGE);
  }
}
// -----------------------------------------------------------------------------
// Post by Slug
// -----------------------------------------------------------------------------
export async function fetchPostBySlug(slug: string) {
  if (dbType === 'postgres') {
    try {
      const data = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at, images
        FROM posts
        WHERE slug = ${slug}
      `;
      return data[0];
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch post.', { cause: error });
    }
  } else {
    await connectDB();
    const post = await PostModel.findOne({ slug }).lean();
    if (!post) return undefined;
    return {
      slug: post.slug,
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      images: post.images,
    };
  }
}

export type CommentWithUser = {
    id: string;
    post_slug: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    user: Pick<User, 'id' | 'name' | 'image'>;
    replies?: CommentWithUser[]; // for tree building
};
export async function getCommentsForPost(postSlug: string): Promise<CommentWithUser[]> {
    if (dbType === 'postgres') {
        const rows = await sql<CommentWithUser[]>`
            SELECT
                c.id,
                c.post_slug,
                c.user_id,
                c.parent_id,
                c.content,
                c.created_at,
                c.updated_at,
                u.id as user__id,
                u.name as user__name,
                u.image as user__image
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_slug = ${postSlug}
            ORDER BY c.created_at ASC
        `;
        // Build tree in memory
        const commentMap = new Map<string, CommentWithUser>();
        const roots: CommentWithUser[] = [];
        for (const row of rows) {
            const comment: CommentWithUser = {
                id: row.id,
                post_slug: row.post_slug,
                user_id: row.user_id,
                parent_id: row.parent_id,
                content: row.content,
                created_at: row.created_at,
                updated_at: row.updated_at,
                user: {
                    id: row.user__id,
                    name: row.user__name,
                    image: row.user__image,
                },
                replies: [],
            };
            commentMap.set(comment.id, comment);
            if (!comment.parent_id) {
                roots.push(comment);
            }
        }
        for (const comment of commentMap.values()) {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies = parent.replies || [];
                    parent.replies.push(comment);
                }
            }
        }
        return roots;
    } else {
        await connectDB();
        const comments = await CommentModel.find({ post_slug: postSlug })
            .populate('user_id', 'name image')
            .sort({ created_at: 1 })
            .lean();
        const commentMap = new Map<string, any>();
        const roots: any[] = [];
        for (const c of comments) {
            const comment = {
                id: c._id.toString(),
                post_slug: c.post_slug,
                user_id: c.user_id._id.toString(),
                parent_id: c.parent_id?.toString() || null,
                content: c.content,
                created_at: c.created_at.toISOString(),
                updated_at: c.updated_at.toISOString(),
                user: {
                    id: c.user_id._id.toString(),
                    name: c.user_id.name,
                    image: c.user_id.image,
                },
                replies: [],
            };
            commentMap.set(comment.id, comment);
            if (!comment.parent_id) {
                roots.push(comment);
            }
        }
        for (const comment of commentMap.values()) {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(comment);
                }
            }
        }

        return roots;
    }
}
// ===================== Post Reactions =====================
export interface PostReactionCounts {
    likes: number;
    dislikes: number;
    userReaction: 'like' | 'dislike' | null;
}

export async function getPostReactions(postSlug: string, userId?: string): Promise<PostReactionCounts> {
    if (dbType === 'postgres') {
        const counts = await sql<{ likes: number; dislikes: number }[]>`
            SELECT
                COUNT(*) FILTER (WHERE reaction_type = 'like') AS likes,
                COUNT(*) FILTER (WHERE reaction_type = 'dislike') AS dislikes
            FROM post_reactions
            WHERE post_slug = ${postSlug}
        `;
        let userReaction: 'like' | 'dislike' | null = null;
        if (userId) {
            const userReactionRow = await sql<{ reaction_type: string }[]>`
                SELECT reaction_type FROM post_reactions
                WHERE post_slug = ${postSlug} AND user_id = ${userId}
            `;
            if (userReactionRow.length > 0) {
                userReaction = userReactionRow[0].reaction_type as 'like' | 'dislike';
            }
        }
        return {
            likes: Number(counts[0]?.likes) || 0,
            dislikes: Number(counts[0]?.dislikes) || 0,
            userReaction,
        };
    } else {
        await connectDB();
        const [likes, dislikes, userReactionDoc] = await Promise.all([
            PostReactionModel.countDocuments({ post_slug: postSlug, reaction_type: 'like' }),
            PostReactionModel.countDocuments({ post_slug: postSlug, reaction_type: 'dislike' }),
            userId ? PostReactionModel.findOne({ post_slug: postSlug, user_id: userId }).lean() : null,
        ]);
        const userReaction = userReactionDoc ? (userReactionDoc.reaction_type as 'like' | 'dislike') : null;
        return { likes, dislikes, userReaction };
    }
}

// ===================== Comment Reactions =====================
export type CommentReactionCounts = {
    counts: Record<string, number>;
    userEmoji: string | null;
};

export async function getCommentReactions(commentId: string, userId?: string): Promise<CommentReactionCounts> {
    if (dbType === 'postgres') {
        const counts = await sql<{ emoji: string; count: number }[]>`
            SELECT emoji, COUNT(*) as count
            FROM comment_reactions
            WHERE comment_id = ${commentId}
            GROUP BY emoji
        `;
        const countsObj: Record<string, number> = {};
      counts.forEach((row: { emoji: string; count: number }) => { countsObj[row.emoji] = Number(row.count); });

        let userEmoji: string | null = null;
        if (userId) {
            const userReaction = await sql<{ emoji: string }[]>`
                SELECT emoji FROM comment_reactions
                WHERE comment_id = ${commentId} AND user_id = ${userId}
                LIMIT 1
            `;
            if (userReaction.length > 0) userEmoji = userReaction[0].emoji;
        }
        return { counts: countsObj, userEmoji };
    } else {
        await connectDB();
        const reactions = await CommentReactionModel.aggregate([
            { $match: { comment_id: new mongoose.Types.ObjectId(commentId) } },
            { $group: { _id: '$emoji', count: { $sum: 1 } } }
        ]);
        const countsObj: Record<string, number> = {};
        reactions.forEach((r: { _id: string; count: number }) => { countsObj[r._id] = r.count; });

        let userEmoji: string | null = null;
        if (userId) {
            const userReaction = await CommentReactionModel.findOne({ comment_id: commentId, user_id: userId }).lean();
            if (userReaction) userEmoji = userReaction.emoji;
        }
        return { counts: countsObj, userEmoji };
    }
}