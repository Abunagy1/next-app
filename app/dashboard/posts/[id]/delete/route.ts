import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const isUserAdmin = session.user.role === 'admin';
    const post = await sql<{ user_id: string }[]>`SELECT user_id FROM posts WHERE slug = ${id}`;

    if (post.length === 0) {
      return NextResponse.redirect(new URL('/dashboard/posts?error=notfound', request.url));
    }

    if (!isUserAdmin && post[0].user_id !== session.user.id) {
      return NextResponse.redirect(new URL('/dashboard/posts?error=unauthorized', request.url));
    }

    await sql`DELETE FROM posts WHERE slug = ${id}`;
    return NextResponse.redirect(new URL('/dashboard/posts?deleted=true', request.url));
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.redirect(new URL('/dashboard/posts?error=failed', request.url));
  }
}