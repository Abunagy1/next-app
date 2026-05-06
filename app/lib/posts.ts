import fs from 'fs';
import path from 'path';
//import { Pool } from 'pg';
import matter from 'gray-matter';
// lib/posts.js - Simplified version
import { remark } from 'remark';
import html from 'remark-html';
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import PostModel from '@/app/lib/db/models/Post';
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
// Helper if not already present
function toISOStringIfDate(value: any): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}
/////////////////////////////////////////////////////////
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
// ---------- FETCH ALL POSTS (sorted by date) ----------
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
// ========== DATABASE IMPLEMENTATION (dual‑db) ==========
async function getSortedPostsDataFromDB(): Promise<Post[]> {
  if (dbType === 'postgres') {
    try {
      const rows = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at, images
        FROM posts
        ORDER BY created_at DESC
      `;
      return rows.map((row: any) => ({
        ...row,
        created_at: toISOStringIfDate(row.created_at) || new Date().toISOString(),
        updated_at: toISOStringIfDate(row.updated_at) || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('PostgreSQL error in getSortedPostsDataFromDB:', error);
      return [];
    }
  } else {
    try {
      await connectDB();
      const docs = await PostModel.find().sort({ created_at: -1 }).lean();
      return docs.map(doc => ({
        slug: doc.slug,
        user_id: doc.user_id?.toString() || '',
        title: doc.title,
        content: doc.content,
        created_at: doc.created_at?.toISOString() || new Date().toISOString(),
        updated_at: doc.updated_at?.toISOString() || new Date().toISOString(),
        images: doc.images || [],
      }));
    } catch (error) {
      console.error('MongoDB error in getSortedPostsDataFromDB:', error);
      return [];
    }
  }
}
async function getAllPostIdsFromDB(): Promise<{ params: { id: string } }[]> {
  if (dbType === 'postgres') {
    try {
      const rows = await sql<{ slug: string }[]>`
        SELECT slug FROM posts
      `;
      return rows.map((row: { slug: string }) => ({ params: { id: row.slug } }));
    } catch (error) {
      console.error('PostgreSQL error in getAllPostIdsFromDB:', error);
      return [];
    }
  } else {
    try {
      await connectDB();
      const docs = await PostModel.find({}, { slug: 1 }).lean();
      return docs.map(doc => ({ params: { id: doc.slug } }));
    } catch (error) {
      console.error('MongoDB error in getAllPostIdsFromDB:', error);
      return [];
    }
  }
}

async function getPostDataFromDB(slug: string): Promise<(Post & { contentHtml: string }) | null> {
  if (dbType === 'postgres') {
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
      } as Post & { contentHtml: string };
    } catch (error) {
      console.error(`PostgreSQL error in getPostDataFromDB for ${slug}:`, error);
      return null;
    }
  } else {
    try {
      await connectDB();
      const doc = await PostModel.findOne({ slug }).lean();
      if (!doc) return null;
      const contentHtml = await markdownToHtml(doc.content);
      return {
        slug: doc.slug,
        user_id: doc.user_id?.toString() || '',
        title: doc.title,
        content: doc.content,
        created_at: doc.created_at?.toISOString() || new Date().toISOString(),
        updated_at: doc.updated_at?.toISOString() || new Date().toISOString(),
        images: doc.images || [],
        contentHtml,
      } as Post & { contentHtml: string };
    } catch (error) {
      console.error(`MongoDB error in getPostDataFromDB for ${slug}:`, error);
      return null;
    }
  }
}

// Add this function alongside existing ones
export async function getPosts(userId?: string): Promise<Post[]> {
  if (USE_DATABASE && dbType === 'postgres') {
    try {
      // In the getPosts function (database branch)
      const rows = await sql<Post[]>`
        SELECT slug, user_id, title, content, created_at, updated_at, images
        FROM posts
        ${userId ? sql`WHERE user_id = ${userId}` : sql``}
        ORDER BY created_at DESC
      `;
      return rows.map((row: any) => ({
        ...row,
        created_at: toISOStringIfDate(row.created_at) || new Date().toISOString(),
        updated_at: toISOStringIfDate(row.updated_at) || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Database error in getPosts:', error);
      return [];
    }
  } else {
    await connectDB();
    let query = PostModel.find().sort('-created_at');
    if (userId) {
      query = query.where('user_id').equals(userId);
    }
    const docs = await query.lean();
    return docs.map(doc => ({
      slug: doc.slug,
      user_id: doc.user_id.toString(),
      title: doc.title,
      content: doc.content,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      images: doc.images,
    }));
      // File mode: return all posts (no user filtering)
      // return getSortedPostsDataFromFiles();
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
// Clear cache function (useful for development)
export function clearPostDataCache() {
  postDataCache.clear();
  if (isDev) {
    console.log('Post data cache cleared');
  }
}
