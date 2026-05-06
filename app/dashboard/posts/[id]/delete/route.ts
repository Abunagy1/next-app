// app/dashboard/posts/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import PostModel from '@/app/lib/db/models/Post';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/user/login', request.url));
  }
  try {
    const isUserAdmin = session.user.role === 'admin';
    if (dbType === 'postgres') {
      const post = await sql<{ user_id: string }[]>`SELECT user_id FROM posts WHERE slug = ${id}`;
      if (post.length === 0) {
        return NextResponse.redirect(new URL('/dashboard/posts?error=notfound', request.url));
      }
      if (!isUserAdmin && post[0].user_id !== session.user.id) {
        return NextResponse.redirect(new URL('/dashboard/posts?error=unauthorized', request.url));
      }
      await sql`DELETE FROM posts WHERE slug = ${id}`;
    } else {
      await connectDB();
      const post = await PostModel.findOne({ slug: id }).lean();
      if (!post) {
        return NextResponse.redirect(new URL('/dashboard/posts?error=notfound', request.url));
      }
      if (!isUserAdmin && post.user_id.toString() !== session.user.id) {
        return NextResponse.redirect(new URL('/dashboard/posts?error=unauthorized', request.url));
      }
      await PostModel.deleteOne({ slug: id });
    }
    return NextResponse.redirect(new URL('/dashboard/posts?deleted=true', request.url));
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.redirect(new URL('/dashboard/posts?error=failed', request.url));
  }
}