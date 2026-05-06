'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import likeOrUnlikeAction from '@/app/lib/actions/likeOrUnlikeAction';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Loader2 } from 'lucide-react';
import { getApiResponseWithToast } from '@/app/lib/helpers.client/apiResponse';

interface LikeButtonProps {
  isBookmarked: boolean;
  keys: { flightId?: string; hotelId?: string; searchState?: any };
  flightOrHotel: 'flight' | 'hotel';
  className?: string;
}

export function LikeButton({ isBookmarked, keys, flightOrHotel, className }: LikeButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackPath = `${pathname}?${searchParams.toString()}`;

  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [likeLoading, setLikeLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setLikeLoading(true);

    const likeUnlikePromise = likeOrUnlikeAction({
      keys,
      flightOrHotel,
      callbackPath,
    });

    await getApiResponseWithToast(likeUnlikePromise, {
      onSuccess: () => {
        setBookmarked(!bookmarked);
      },
    });

    setLikeLoading(false);
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="icon"
      disabled={likeLoading}
      className={cn(
        'group relative h-10 w-10 rounded-full border-2 transition-all duration-200',
        // Light mode
        'border-gray-300 hover:border-red-400 hover:bg-red-50',
        // Dark mode
        'dark:border-gray-600 dark:hover:border-red-500 dark:hover:bg-red-900/20',
        className
      )}
      aria-label={bookmarked ? 'Remove from favourites' : 'Add to favourites'}
    >
      {likeLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={cn(
            'h-5 w-5 transition-all duration-200',
            // Heart fill and stroke based on state
            bookmarked
              ? 'fill-red-500 stroke-red-500'
              : 'fill-none stroke-current text-gray-700 dark:text-white',
            // On hover (when not loading)
            !likeLoading && 'group-hover:scale-110'
          )}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </Button>
  );
}