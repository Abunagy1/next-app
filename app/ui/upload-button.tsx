'use client';
import { UploadButton } from "@uploadthing/react";
import type { ourFileRouter } from "@/app/api/uploadthing/core";
export function AvatarUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  return (
    <UploadButton<typeof ourFileRouter, "avatarUploader">
      endpoint="avatarUploader"
      onClientUploadComplete={(res) => {
        if (res && res[0]) onUploadComplete(res[0].url);
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}