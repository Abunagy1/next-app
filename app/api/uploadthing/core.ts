import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Old project routes (used by travel agency features)
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      console.log("Avatar URL:", file.url);
      return { uploadedBy: metadata.userId };
    }),

  postImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post image uploaded:", file.url);
      return { uploadedBy: metadata.userId };
    }),

  // Base project routes (keep these if used elsewhere)
  profilePicture: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile picture upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  coverPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Cover photo uploaded for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;