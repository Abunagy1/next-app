// we've kept all the data queries in the data.ts file, and you can import them into the components
import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Post,
  Revenue,
  Product,
} from './definitions';
import { formatCurrency } from './utils';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)
    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    const data = await sql<Revenue[]>`SELECT * FROM revenue`;
    // console.log('Data fetch completed after 3 seconds.');
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

// Fetch latest invoices – optionally filtered by user's customer IDs
import { LatestInvoice } from './definitions'; // make sure LatestInvoice is exported
// Type for the raw database row (amount is number)
type RawLatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: number;
};
import { User } from './definitions';

export async function getUserById(userId: string): Promise<Pick<User, 'name' | 'image'> | null> {
  try {
    const users = await sql<Pick<User, 'name' | 'image'>[]>`
      SELECT name, image FROM users WHERE id = ${userId}
    `;
    return users[0] || null;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
// export async function fetchLatestInvoices(userCustomerIds?: string[]): Promise<LatestInvoice[]> {
//   try {
//     // Build WHERE clause dynamically using sql conditions
//     const conditions = [];
//     if (userCustomerIds && userCustomerIds.length > 0) {
//       conditions.push(sql`customers.id = ANY(${userCustomerIds})`);
//     }
//     const whereClause = conditions.length > 0
//       ? sql`WHERE ${sql.join(conditions, ' AND ')}`
//       : sql``;
//     // Execute query with proper typing
//     const data = await sql<RawLatestInvoice[]>`
//       SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       ${whereClause}
//       ORDER BY invoices.date DESC
//       LIMIT 5
//     `;
//     // Format amount to currency string
//     const latestInvoices = data.map((invoice) => ({
//       id: invoice.id,
//       name: invoice.name,
//       image_url: invoice.image_url,
//       email: invoice.email,
//       amount: formatCurrency(invoice.amount),
//     }));
//     return latestInvoices;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch the latest invoices.');
//   }
// }

export async function fetchLatestInvoices(userCustomerIds?: string[]): Promise<LatestInvoice[]> {
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
    throw new Error('Failed to fetch the latest invoices.');
  }
}
// Fetch invoice stats for a regular user (based on their customer IDs)
export async function fetchUserInvoiceStats(userCustomerIds: string[]) {
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
    throw new Error('Failed to fetch user invoice stats.');
  }
}

//In JavaScript, you can use the Promise.all() or Promise.allSettled() functions to initiate all promises at the same time.
// For example, in data.ts, we're using Promise.all() in the fetchCardData() function for Parallel data fetching to avoid waterfalls:
export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

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
    throw new Error('Failed to fetch card data.');
  }
}
const ITEMS_PER_PAGE = 6;
// export async function fetchFilteredInvoices(
//   query: string,
//   currentPage: number,
//   userCustomerIds?: string[],
// ) {
//   const offset = (currentPage - 1) * ITEMS_PER_PAGE;
//   try {
//     let baseQuery = sql`
//       SELECT
//         invoices.id,
//         invoices.amount,
//         invoices.date,
//         invoices.status,
//         customers.name,
//         customers.email,
//         customers.image_url
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//     `;
//     let whereClause;
//     if (userCustomerIds && userCustomerIds.length > 0) {
//       whereClause = sql`
//         WHERE customers.id = ANY(${userCustomerIds})
//           AND (
//             customers.name ILIKE ${`%${query}%`} OR
//             customers.email ILIKE ${`%${query}%`} OR
//             invoices.amount::text ILIKE ${`%${query}%`} OR
//             invoices.date::text ILIKE ${`%${query}%`} OR
//             invoices.status ILIKE ${`%${query}%`}
//           )
//       `;
//     } else {
//       whereClause = sql`
//         WHERE
//           customers.name ILIKE ${`%${query}%`} OR
//           customers.email ILIKE ${`%${query}%`} OR
//           invoices.amount::text ILIKE ${`%${query}%`} OR
//           invoices.date::text ILIKE ${`%${query}%`} OR
//           invoices.status ILIKE ${`%${query}%`}
//       `;
//     }
//     const invoices = await sql<InvoicesTable[]>`
//       ${baseQuery}
//       ${whereClause}
//       ORDER BY invoices.date DESC
//       LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
//     `;
//     return invoices;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch invoices.');
//   }
// }
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  userCustomerIds?: string[],
  isAdmin?: boolean
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    let baseQuery = sql`
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
    throw new Error('Failed to fetch invoices.');
  }
}
// export async function fetchInvoicesPages(query: string, userCustomerIds?: string[]) {
//   try {
//     let whereClause;
//     if (userCustomerIds && userCustomerIds.length > 0) {
//       whereClause = sql`
//         WHERE customers.id = ANY(${userCustomerIds})
//           AND (
//             customers.name ILIKE ${`%${query}%`} OR
//             customers.email ILIKE ${`%${query}%`} OR
//             invoices.amount::text ILIKE ${`%${query}%`} OR
//             invoices.date::text ILIKE ${`%${query}%`} OR
//             invoices.status ILIKE ${`%${query}%`}
//           )
//       `;
//     } else {
//       whereClause = sql`
//         WHERE
//           customers.name ILIKE ${`%${query}%`} OR
//           customers.email ILIKE ${`%${query}%`} OR
//           invoices.amount::text ILIKE ${`%${query}%`} OR
//           invoices.date::text ILIKE ${`%${query}%`} OR
//           invoices.status ILIKE ${`%${query}%`}
//       `;
//     }
//     const data = await sql`
//       SELECT COUNT(*)
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       ${whereClause}
//     `;
//     const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
//     return totalPages;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch total number of invoices.');
//   }
// }
export async function fetchInvoicesPages(query: string, userCustomerIds?: string[], isAdmin?: boolean) {
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
    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
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
    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    console.log(invoice); // Invoice is an empty array []
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}


export async function fetchCustomers() {
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
    throw new Error('Failed to fetch all customers.');
  }
}
export async function fetchCustomersPages(
  query: string,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<number> {
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
    const totalCount = Number(countResult[0].count);
    const ITEMS_PER_PAGE = 6; // same as invoices
    return Math.ceil(totalCount / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customers pages.');
  }
}
export async function fetchFilteredCustomersForUser(
  query: string,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<CustomersTableType[]> {
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
    // Return raw numbers (no formatting)
    return data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customers.');
  }
}
export async function fetchFilteredCustomersForUserPaginated(
  query: string,
  currentPage: number,
  userCustomerIds?: string[],
  isAdmin?: boolean
): Promise<CustomersTableType[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

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
    throw new Error('Failed to fetch customers.');
  }
}

export async function getProductById(id: number): Promise<Product | undefined> {
  try {
    const products = await sql<Product[]>`SELECT * FROM products WHERE id = ${id}`;
    return products[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch product.');
  }
}

export async function getUserCustomerIds(userId: string): Promise<string[]> {
  const customers = await sql<{ id: string }[]>`SELECT id FROM customers WHERE user_id = ${userId}`;
  return customers.map(c => c.id);
}

export async function fetchFilteredCustomers(query: string) {
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
    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}



export async function fetchFilteredPostsByUser(
  userId: string,
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
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
    throw new Error('Failed to fetch posts.');
  }
}

export async function fetchPostsPagesByUser(userId: string, query: string) {
  try {
    const data = await sql`
      SELECT COUNT(*)
      FROM posts
      WHERE user_id = ${userId} AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`})
    `;
    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of posts.');
  }
}




export async function fetchFilteredPosts(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
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
    throw new Error('Failed to fetch posts.');
  }
}

export async function fetchPostsPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
      FROM posts
      WHERE title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`}
    `;
    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of posts.');
  }
}

export async function fetchPostBySlug(slug: string) {
  try {
    const data = await sql<Post[]>`
      SELECT slug, user_id, title, content, created_at, updated_at, images
      FROM posts
      WHERE slug = ${slug}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch post.');
  }
}