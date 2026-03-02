import fs from 'fs';
import path from 'path';
//import { Pool } from 'pg';
import matter from 'gray-matter';
// lib/posts.js - Simplified version
import { remark } from 'remark';
import html from 'remark-html';
// import { sql } from '@vercel/postgres';
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
import { Post } from './definitions';
const USE_DATABASE = process.env.USE_DATABASE || 'files';
const postsDirectory = path.join(process.cwd(), 'app/content/posts');
const isDev = process.env.NODE_ENV === 'development';
// Simple in-memory cache for build time - (only used for file mode)
const postDataCache = new Map();
// Helper to convert markdown → HTML (cached per post)
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}
// Helper to safely convert date to ISO string
// function toISOStringIfDate(value: Date | string | undefined): string | undefined {
//   if (value === undefined) return undefined;
//   return value instanceof Date ? value.toISOString() : value;
// }
// Helper if not already present
function toISOStringIfDate(value: any): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}
// export function getAllPostIds() {
//     const fileNames = fs.readdirSync(postsDirectory);
//     // Returns an array that looks like this:
//     // [
//     //   {
//     //     params: {
//     //       id: 'ssg-ssr'
//     //     }
//     //   },
//     //   {
//     //     params: {
//     //       id: 'pre-rendering'
//     //     }
//     //   }
//     // ]
//     return fileNames.map((fileName) => {
//         return {
//             params: {
//                 id: fileName.replace(/\.md$/, ''),
//             },
//         };
//     });
// }
/////////////////////////////////////////////////////////
//If you prefer pg, here's how to adapt lib/posts.ts:
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });
// export async function getSortedPostsData() {
//   const client = await pool.connect();
//   try {
//     const result = await client.query('SELECT id, title, date, content FROM posts ORDER BY date DESC');
//     return result.rows;
//   } finally {
//     client.release();
//   }
// }
// ... similar for other functions
/////////////////////////////////////////////////////////
// ---------- FETCH ALL POSTS (sorted by date) ----------
// ========== FILE‑BASED IMPLEMENTATION ==========
async function getSortedPostsDataFromFiles(): Promise<Post[]> {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.error(`Posts directory not found: ${postsDirectory}`);
      return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter(fn => fn.endsWith('.md'))
      .map(fileName => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        return {
          slug,
          user_id: '', // file posts don't have a user; you can assign a default if needed
          title: data.title,
          content,
          created_at: data.date,
          updated_at: data.date,
        } as Post;
      });
    return allPostsData.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error in getSortedPostsDataFromFiles:', error);
    return [];
  }
}
async function getAllPostIdsFromFiles(): Promise<{ params: { id: string } }[]> {
  try {
    if (!fs.existsSync(postsDirectory)) return [];
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
      .filter(fn => fn.endsWith('.md'))
      .map(fileName => ({
        params: { id: fileName.replace(/\.md$/, '') },
      }));
  } catch (error) {
    console.error('Error in getAllPostIdsFromFiles:', error);
    return [];
  }
}
async function getPostDataFromFiles(slug: string): Promise<(Post & { contentHtml: string }) | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) return null;
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const contentHtml = await markdownToHtml(content);
    return {
      slug,
      user_id: '',
      title: data.title,
      content,
      created_at: data.date,
      updated_at: data.date,
      contentHtml, // extra field for rendering
    } as Post & { contentHtml: string };
  } catch (error) {
    console.error(`Error in getPostDataFromFiles for ${slug}:`, error);
    return null;
  }
}
// ========== DATABASE IMPLEMENTATION ==========
async function getSortedPostsDataFromDB(): Promise<Post[]> {
  try {
    const rows = await sql<Post[]>`
      SELECT slug, user_id, title, content, created_at, updated_at, images
      FROM posts
      ORDER BY created_at DESC
    `;
    // Convert Date objects to ISO strings
    return rows.map(row => ({
      ...row,
      created_at: toISOStringIfDate(row.created_at) || new Date().toISOString(),
      updated_at: toISOStringIfDate(row.updated_at) || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Database error in getSortedPostsDataFromDB:', error);
    return [];
  }
}
async function getPostDataFromDB(slug: string): Promise<(Post & { contentHtml: string }) | null> {
  try {
    const rows = await sql<Post[]>`
      SELECT slug, user_id, title, content, created_at, updated_at, images
      FROM posts
      WHERE slug = ${slug}
    `;
    if (rows.length === 0) return null;
    const post = rows[0];
    const contentHtml = await markdownToHtml(post.content);
    return {
      ...post,
      created_at: toISOStringIfDate(post.created_at) || new Date().toISOString(),
      updated_at: toISOStringIfDate(post.updated_at) || new Date().toISOString(),
      contentHtml,
    };
  } catch (error) {
    console.error(`Database error in getPostDataFromDB for ${slug}:`, error);
    return null;
  }
}
// async function getPostDataFromDB(slug: string): Promise<(Post & { contentHtml: string }) | null> {
//   try {
//     const { rows } = await sql<Post>`
//       SELECT slug, user_id, title, content, created_at, updated_at
//       FROM posts
//       WHERE slug = ${slug}
//     `;
//     if (rows.length === 0) return null;
//     const post = rows[0];
//     const contentHtml = await markdownToHtml(post.content);
//     return { ...post, contentHtml } as Post & { contentHtml: string };
//   } catch (error) {
//     console.error(`Database error in getPostDataFromDB for ${slug}:`, error);
//     return null;
//   }
// }

// Add this function alongside existing ones
export async function getPosts(userId?: string): Promise<Post[]> {
  if (USE_DATABASE) {
    try {
      // In the getPosts function (database branch)
      const rows = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at, images
        FROM posts
        ${userId ? sql`WHERE user_id = ${userId}` : sql``}
        ORDER BY created_at DESC
      `;
      return rows.map(row => ({
        ...row,
        created_at: toISOStringIfDate(row.created_at) || new Date().toISOString(),
        updated_at: toISOStringIfDate(row.updated_at) || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Database error in getPosts:', error);
      return [];
    }
  } else {
    // File mode: return all posts (no user filtering)
    return getSortedPostsDataFromFiles();
  }
}

async function getAllPostIdsFromDB(): Promise<{ params: { id: string } }[]> {
  try {
    const rows = await sql<{ slug: string }[]>`
      SELECT slug FROM posts
    `;
    return rows.map(row => ({ params: { id: row.slug } }));
  } catch (error) {
    console.error('Database error in getAllPostIdsFromDB:', error);
    return [];
  }
}

// ========== EXPORTED UNIFIED FUNCTIONS ==========
export async function getSortedPostsData(): Promise<Post[]> {
  return USE_DATABASE
    ? getSortedPostsDataFromDB()
    : getSortedPostsDataFromFiles();
}
export async function getAllPostIds(): Promise<{ params: { id: string } }[]> {
  return USE_DATABASE
    ? getAllPostIdsFromDB()
    : getAllPostIdsFromFiles();
}
export async function getPostData(slug: string): Promise<(Post & { contentHtml: string }) | null> {
  return USE_DATABASE
    ? getPostDataFromDB(slug)
    : getPostDataFromFiles(slug);
}
// Optional cache clear (only relevant for file mode)
// export function clearPostDataCache() {
//   // Only implemented for file mode if needed
// }
// export async function getSortedPostsData() {
//   try {
//     console.log('Looking for posts in:', postsDirectory);
//     // Check if directory exists
//     if (!fs.existsSync(postsDirectory)) {
//       console.error(`Posts directory not found: ${postsDirectory}`);
//       // List contents of current directory for debugging
//       console.log('Current directory contents:', fs.readdirSync(process.cwd()));
//       return [];
//     }
//     const { rows } = await sql<Post>`
//       SELECT id, title, date, content
//       FROM posts
//       ORDER BY date DESC
//     `;
//     // Get file names under /posts
//     const fileNames = fs.readdirSync(postsDirectory);
//     const allPostsData = fileNames.map((fileName) => {
//         // Remove ".md" from file name to get id
//         const id = fileName.replace(/\.md$/, '');
//         // Read markdown file as string
//         const fullPath = path.join(postsDirectory, fileName);
//         const fileContents = fs.readFileSync(fullPath, 'utf8');
//         // Use gray-matter to parse the post metadata section
//         const matterResult = matter(fileContents);
//         // Combine the data with the id
//         return {
//             id,
//           ...(matterResult.data as { date: string; title: string }),
//              rows
//         };
//     });
//     // Sort posts by date
//   // return allPostsData.sort((a, b) => {
//   //   return new Date(b.date).getTime() - new Date(a.date).getTime();
//   // });  
//   return allPostsData.sort((a, b) => {
//     if (a.date < b.date) {
//       return 1;
//     } else {
//       return -1;
//     }
//   });
// } catch (error) {
//     console.error('Error in getSortedPostsData:', error);
//     return [];
//   }
// }
// Update this function to return App Router compatible format
// ---------- FETCH ALL POST IDs (for generateStaticParams) ----------
// export async function getAllPostIds(): Promise<{ params: { id: string } }[]> {
//   try {
//     console.log('getAllPostIds - Looking in:', postsDirectory);
//     if (!fs.existsSync(postsDirectory)) {
//       console.error(`Posts directory not found in getAllPostIds: ${postsDirectory}`);
//       return [];
//     }
//     const { rows } = await sql<{ id: string }>`
//       SELECT id FROM posts
//     `;
//     const fileNames = fs.readdirSync(postsDirectory);
//     console.log('getAllPostIds - Found files:', fileNames);
//     // Return App Router format
//     return fileNames
//       .filter(fileName => fileName.endsWith('.md'))
//       .map((fileName) => {
//         return {
//           params: {
//             id: fileName.replace(/\.md$/, ''),
//           },
//         };
//       }),
//     rows.map(row => ({params: { id: row.id }}));
//   } catch (error) {
//     console.error('Error in getAllPostIds:', error);
//     return [];
//   }
// }
// // ---------- FETCH SINGLE POST (with rendered HTML) ----------
// export async function getPostData(id: string) {
//   // Check cache first
//   if (postDataCache.has(id)) {
//     if (isDev) {
//       console.log(`Cache hit for post: ${id}`);
//     }
//     return postDataCache.get(id);
//   }
//   try {
//     const fullPath = path.join(postsDirectory, `${id}.md`);
//     console.log('getPostData - Looking for:', fullPath);
//     if (isDev) {
//       console.log('getPostData - Looking for:', fullPath);
//     }
//     if (!fs.existsSync(fullPath)) {
//       console.error(`Post file not found: ${fullPath}`);
//       return null;
//     }
//     const fileContents = fs.readFileSync(fullPath, 'utf8');
//     const matterResult = matter(fileContents);
//     // Use remark to convert markdown into HTML string
//     const processedContent = await remark()
//       .use(html)
//       .process(matterResult.content);
//     const contentHt = processedContent.toString();
//     // Combine the data with the id and contentHtml
//     // return {
//     //   id,
//     //   contentHtml,
//     //   ...(matterResult.data as { date: string; title: string }),
//     // };
//     const { rows } = await sql<Post>`
//       SELECT id, title, date, content
//       FROM posts
//       WHERE id = ${id}
//     `;
//     if (rows.length === 0) return null;
//     const post = rows[0];
//     const contentHtml = await markdownToHtml(post.content);
//     const result = {
//       id,
//       contentHt,
//       ...(matterResult.data as { date: string; title: string }),
//       ...post,
//       contentHtml,
//     };
//     // Cache the result
//     postDataCache.set(id, result);
//     if (isDev) {
//       console.log(`Cached post data for: ${id}`);
//     }
//     return result;
//   } catch (error) {
//     if (isDev) {
//       console.error(`Error getting post data for ${id}:`, error);
//     }
//     //console.error(`Error getting post data for ${id}:`, error);
//     return null;
//   }
// }
// Clear cache function (useful for development)
export function clearPostDataCache() {
  postDataCache.clear();
  if (isDev) {
    console.log('Post data cache cleared');
  }
}
