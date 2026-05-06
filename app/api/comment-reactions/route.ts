import { NextRequest, NextResponse } from 'next/server';
import { getCommentReactions } from '@/app/lib/data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing comment id' }, { status: 400 });
    const session = await getServerSession(authOptions);
    const { counts, userEmoji } = await getCommentReactions(id, session?.user?.id);
    return NextResponse.json({ counts, userEmoji });
}