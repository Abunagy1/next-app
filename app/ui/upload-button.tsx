'use client';

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface AvatarUploadProps {
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ onUploadComplete }: AvatarUploadProps) {
  return (
    <UploadButton<OurFileRouter, "avatarUploader">
      endpoint="avatarUploader"
      onClientUploadComplete={(res) => {
        if (res && res[0]) {
          onUploadComplete(res[0].url); // ✅ use file.url
        }
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}