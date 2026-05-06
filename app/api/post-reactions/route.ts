import { NextRequest, NextResponse } from 'next/server';
import { getPostReactions } from '@/app/lib/data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    const session = await getServerSession(authOptions);
    const data = await getPostReactions(slug, session?.user?.id);
    return NextResponse.json(data);
}