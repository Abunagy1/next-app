// import { generateHotelsDB } from "@/app/lib/db/generateForDB/hotels/generateHotels";
// import fs from "fs/promises";
// export async function POST(req) {
//   if (
//     req.headers.get("Authorization") !==
//     `Bearer ${process.env.API_SECRET_TOKEN}`
//   ) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//   try {
//     const data = await generateHotelsDB();
//     await fs.mkdir("./generated/hotels", { recursive: true });
//     for (const [key, value] of Object.entries(data)) {
//       await fs.writeFile(
//         `./generated/hotels/${key}.json`,
//         JSON.stringify(value, null, 2),
//       );
//     }
//     console.log("Hotels files generated successfully");
//     return Response.json({
//       success: true,
//       message: "Hotels files generated successfully",
//     });
//   } catch (e) {
//     console.log(e);
//     return Response.json(
//       { success: false, message: "Error generating files" },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { generateHotelsDB } from '@/app/lib/db/generateForDB/hotels/generateHotels';
import fs from 'fs/promises';
import path from 'path';
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await generateHotelsDB();
    const outDir = path.join(process.cwd(), 'generated', 'hotels');
    await fs.mkdir(outDir, { recursive: true });
    for (const [key, value] of Object.entries(data)) {
      await fs.writeFile(
        path.join(outDir, `${key}.json`),
        JSON.stringify(value, null, 2)
      );
    }
    console.log('Hotels files generated successfully');
    return NextResponse.json({ success: true, message: 'Hotels files generated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error generating files' }, { status: 500 });
  }
}