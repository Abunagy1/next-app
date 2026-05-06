import 'server-only';
import Stripe from 'stripe';

/**
 * Initializes and returns a Stripe instance using the secret key from environment variables.
 */
export default function initStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover", // Use latest stable version
  });
}

export const stripe = initStripe();

/**
 * Creates a new customer in Stripe.
 */
export async function createCustomer(
  data: Stripe.CustomerCreateParams,
  options?: Stripe.RequestOptions
): Promise<Stripe.Response<Stripe.Customer>> {
  return stripe.customers.create(data, options);
}

/**
 * Retrieves a customer by ID from Stripe.
 */
export async function getCustomerById(
  id: string,
  params?: Stripe.CustomerRetrieveParams,
  options?: Stripe.RequestOptions
): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> {
  return stripe.customers.retrieve(id, params, options);
}

/**
 * Retrieves a list of customers from Stripe.
 */
export async function getAllCustomers(
  params?: Stripe.CustomerListParams
): Promise<Stripe.ApiList<Stripe.Customer>> {
  return stripe.customers.list(params);
}

/**
 * Creates a new customer only if no customer with the same values for the given matcherKeys exists.
 * @param data - Customer creation data
 * @param options - Stripe request options
 * @param matcherKeys - Keys to search for uniqueness (e.g., ['email'])
 * @throws Error if a matching customer already exists
 */
export async function createUniqueCustomer(
  data: Stripe.CustomerCreateParams,
  options?: Stripe.RequestOptions,
  matcherKeys: (keyof Stripe.CustomerCreateParams)[] = ['email']
): Promise<Stripe.Response<Stripe.Customer>> {
  const query = matcherKeys
    .map((key) => `${key}:"${data[key]}"`)
    .join(' AND ');
  const existing = await stripe.customers.search({ query });
  if (existing.data.length > 0) {
    // Return the existing customer instead of throwing
    return existing.data[0] as Stripe.Response<Stripe.Customer>;
  }
  return stripe.customers.create(data, options);
}

/**
 * Deletes a customer from Stripe by ID.
 */
export async function deleteCustomer(id: string): Promise<Stripe.Response<Stripe.DeletedCustomer>> {
  if (!id) throw new Error('Customer id is required');
  const customer = await getCustomerById(id);
  if (customer.deleted) return customer as Stripe.Response<Stripe.DeletedCustomer>;
  return stripe.customers.del(id);
}

/**
 * Creates a refund for a charge.
 */
export async function requestRefund(
  params: Stripe.RefundCreateParams,
  options?: Stripe.RequestOptions
): Promise<Stripe.Response<Stripe.Refund>> {
  return stripe.refunds.create(params, options);
}

/**
 * Retrieves a list of refunds for a given charge ID.
 */
export async function getRefundList(
  chargeId: string,
  params: Stripe.RefundListParams = { limit: 1 },
  options?: Stripe.RequestOptions
): Promise<Stripe.Response<Stripe.ApiList<Stripe.Refund>>> {
  return stripe.refunds.list(
    {
      charge: chargeId,
      ...params,
    },
    options
  );
}