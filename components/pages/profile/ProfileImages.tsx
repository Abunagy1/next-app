
'use client';
import { useState } from 'react';
import { UploadCoverPhoto } from '@/components/pages/profile/ui/UploadCoverPhoto';
import { ProfileAvatar } from '@/components/pages/profile/ui/ProfileAvatar';
// relative form 
// import { UploadCoverPhoto } from './ui/UploadCoverPhoto';
// import { ProfileAvatar } from './ui/ProfileAvatar';
import Image from 'next/image';
const DEFAULT_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=1170&auto=format&fit=crop';
interface ProfileImagesProps {
  image: string;
  cover: string;
  name: string;
  email: string;
}

export function ProfileImages({ image, cover, name, email }: ProfileImagesProps) {
  const initialSrc = cover && cover !== 'null' ? cover : '/profiles/cover.jpg';
  const [coverSrc, setCoverSrc] = useState(initialSrc);
  // const coverSrc = cover && cover !== 'null' ? cover : '/profiles/cover.jpg';
  return (
    <div className="relative mt-[40px]">
      <div className="relative">
        <Image
          width={1440}
          height={350}
          src={coverSrc}
          alt="Cover photo"
          className="h-[350px] w-full rounded-md sm:rounded-[12px] object-cover object-center"
          style={{ width: 'auto', height: 'auto' }}   // ← fix the warning
          onError={() => {
            // If the local cover fails, switch to the Unsplash fallback
            setCoverSrc(DEFAULT_COVER_FALLBACK);
          }}
          priority
        />
        <div className="absolute z-50 bottom-[24px] right-[24px]">
          <UploadCoverPhoto />
        </div>
      </div>
      <div className="relative gap-3 -top-[80px] flex w-full xsm:text-center px-5 flex-col items-start xsm:items-center">
        <ProfileAvatar image={image} />
        <div>
          <h2 className="text-[1.5rem] font-semibold">{name}</h2>
          <p className="opacity-75">{email}</p>
        </div>
      </div>
    </div>
  );
}
