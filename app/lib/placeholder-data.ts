// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
const users = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    name: 'Mohamed Nagy',
    email: 'postta@aol.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || '123456789',
    email_verified: true,
    image: '/profiles/profile.jpg',
    phone: '+201112270141',
    city: 'New York',
    about: 'I am the admin user.',
    birth_date: '1979-08-22',
    role: 'admin',
  },
];
// Helper to create a URL‑friendly slug
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
const posts = [
  {
    user_id: users[0].id,
    slug: slugify('Hello NEXT'),
    title: 'Hello NEXT',
    created_at: '2025-01-01',   // ISO date (no time)
    content: 'Welcome to Next.js',
    updated_at: '2026-01-01',
  },
];

const customers = [
  {
    id: 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa',
    name: 'Evil Rabbit',
    email: 'evil@rabbit.com',
    image_url: '/customers/evil-rabbit.png',
  },
  {
    id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
    name: 'Delba de Oliveira',
    email: 'delba@oliveira.com',
    image_url: '/customers/delba-de-oliveira.png',
  },
  {
    id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
    name: 'Lee Robinson',
    email: 'lee@robinson.com',
    image_url: '/customers/lee-robinson.png',
  },
  {
    id: '76d65c26-f784-44a2-ac19-586678f7c2f2',
    name: 'Michael Novotny',
    email: 'michael@novotny.com',
    image_url: '/customers/michael-novotny.png',
  },
  {
    id: 'CC27C14A-0ACF-4F4A-A6C9-D45682C144B9',
    name: 'Amy Burns',
    email: 'amy@burns.com',
    image_url: '/customers/amy-burns.png',
  },
  {
    id: '13D07535-C59E-4157-A011-F8D2EF4E0CBB',
    name: 'Balazs Orban',
    email: 'balazs@orban.com',
    image_url: '/customers/balazs-orban.png',
  },
];

const invoices = [
  {
    customer_id: customers[0].id,
    amount: 15795,
    status: 'pending',
    date: '2022-12-06',
  },
  {
    customer_id: customers[1].id,
    amount: 20348,
    status: 'pending',
    date: '2022-11-14',
  },
  {
    customer_id: customers[4].id,
    amount: 3040,
    status: 'paid',
    date: '2022-10-29',
  },
  {
    customer_id: customers[3].id,
    amount: 44800,
    status: 'paid',
    date: '2023-09-10',
  },
  {
    customer_id: customers[5].id,
    amount: 34577,
    status: 'pending',
    date: '2023-08-05',
  },
  {
    customer_id: customers[2].id,
    amount: 54246,
    status: 'pending',
    date: '2023-07-16',
  },
  {
    customer_id: customers[0].id,
    amount: 666,
    status: 'pending',
    date: '2023-06-27',
  },
  {
    customer_id: customers[3].id,
    amount: 32545,
    status: 'paid',
    date: '2023-06-09',
  },
  {
    customer_id: customers[4].id,
    amount: 1250,
    status: 'paid',
    date: '2023-06-17',
  },
  {
    customer_id: customers[5].id,
    amount: 8546,
    status: 'paid',
    date: '2023-06-07',
  },
  {
    customer_id: customers[1].id,
    amount: 500,
    status: 'paid',
    date: '2023-08-19',
  },
  {
    customer_id: customers[5].id,
    amount: 8945,
    status: 'paid',
    date: '2023-06-03',
  },
  {
    customer_id: customers[2].id,
    amount: 1000,
    status: 'paid',
    date: '2022-06-05',
  },
];

const revenue = [
  { month: 'Jan', revenue: 2000 },
  { month: 'Feb', revenue: 1800 },
  { month: 'Mar', revenue: 2200 },
  { month: 'Apr', revenue: 2500 },
  { month: 'May', revenue: 2300 },
  { month: 'Jun', revenue: 3200 },
  { month: 'Jul', revenue: 3500 },
  { month: 'Aug', revenue: 3700 },
  { month: 'Sep', revenue: 2500 },
  { month: 'Oct', revenue: 2800 },
  { month: 'Nov', revenue: 3000 },
  { month: 'Dec', revenue: 4800 },
];
// New products array from the old store
const products = [
  { name: "baked beans", price: 0.50, image: "beans.jpg", type: "vegetables" },
  { name: "hot dogs", price: 1.99, image: "hotdogs.jpg", type: "meat" },
  { name: "spam", price: 2.85, image: "spam.jpg", type: "meat" },
  { name: "refried beans", price: 0.99, image: "refried.jpg", type: "vegetables" },
  { name: "kidney beans", price: 0.58, image: "kidney.jpg", type: "vegetables" },
  { name: "garden peas", price: 0.52, image: "gardenpeas.jpg", type: "vegetables" },
  { name: "mushy peas", price: 0.58, image: "mushypeas.jpg", type: "vegetables" },
  { name: "corned beef", price: 2.39, image: "cornedbeef.jpg", type: "meat" },
  { name: "tomato soup", price: 1.40, image: "tomatosoup.jpg", type: "soup" },
  { name: "chopped tomatoes", price: 0.50, image: "tomato.jpg", type: "vegetables" },
  { name: "chicken noodle soup", price: 1.89, image: "chickennoodle.jpg", type: "soup" },
  { name: "carrot and coriander soup", price: 1.49, image: "carrotcoriander.jpg", type: "soup" },
];
  
export { users, posts,customers, invoices, revenue, products };
