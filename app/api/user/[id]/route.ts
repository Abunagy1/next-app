// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { sql, dbType, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';

// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await params;

//   // Optional: allow public access? Original required auth? We'll require auth for consistency.
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     if (dbType === 'postgres') {
//       const users = await sql<{ name: string; image: string | null }[]>`
//         SELECT CONCAT(first_name, ' ', last_name) AS name, profile_image AS image
//         FROM users
//         WHERE id = ${id}
//       `;
//       if (users.length === 0) {
//         return NextResponse.json({ error: 'User not found' }, { status: 404 });
//       }
//       return NextResponse.json({
//         name: users[0].name,
//         profileImage: users[0].image,
//       });
//     } else {
//       await connectDB();
//       const user = await dataModels.User.findById(id)
//         .select('firstName lastName image')
//         .lean();
//       if (!user) {
//         return NextResponse.json({ error: 'User not found' }, { status: 404 });
//       }
//       return NextResponse.json({
//         name: `${user.firstName} ${user.lastName}`,
//         profileImage: user.image,
//       });
//     }
//   } catch (error) {
//     console.error('[user/id] Error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (dbType === 'postgres') {
    const users = await sql`
      SELECT CONCAT(first_name, ' ', last_name) AS name, image
      FROM users
      WHERE id = ${id}
    `;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({
      name: users[0].name,
      image: users[0].image,      // map to expected field of profileImage 
    });
  } else {
    await connectDB();
    const user = await dataModels.User.findById(id).select('firstName lastName image').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({
      name: `${user.firstName} ${user.lastName}`,
      image: user.image,
    });
  }
}