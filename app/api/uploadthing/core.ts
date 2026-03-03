import { createUploadthing, type FileRouter } from "uploadthing/next";
//import { auth } from "@/auth";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const f = createUploadthing();
export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      //const session = await auth();
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("Avatar URL:", file.ufsUrl); // ✅ use ufsUrl
    }),
  postImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .middleware(async () => {
      //const session = await auth();
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Post image uploaded:", file.ufsUrl); // ✅ use ufsUrl
    }),
} satisfies FileRouter;