'use client';

import { UploadProfilePicture } from '@/components/pages/profile/ui/UploadProfilePicture';
import Image from 'next/image';

interface ProfileAvatarProps {
  image: string;
}

export function ProfileAvatar({ image }: ProfileAvatarProps) {
  return (
    <>
      <div className="relative inline-block rounded-full border-4 border-tertiary dark:border-gray-600">
        <Image
          className="h-[160px] w-[160px] rounded-full bg-background object-cover object-center dark:bg-gray-700"
          src={image}
          alt="avatar"
          width={160}
          height={160}
          priority
        />
        <UploadProfilePicture />
      </div>
    </>
  );
}