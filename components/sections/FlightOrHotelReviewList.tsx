'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SingleReview } from '@/components/local-ui/SingleReview';
import leftArrow from '@/public/travel/icons/forward.svg';

interface Review {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  flagged: string[];
}

interface Session {
  user?: {
    id: string;
  };
}

interface FlightOrHotelReviewListProps {
  reviews: Review[];
  session: Session | null;
}

export function FlightOrHotelReviewList({ reviews, session }: FlightOrHotelReviewListProps) {
  const scrollView = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const handlePageChange = (action: 'prev' | 'next') => {
    if (!scrollView.current) return;
    if (action === 'prev' && currentPage - 1 > 0) {
      const prevIndex = currentPage - 1 - 1;
      (scrollView.current.children[prevIndex] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setCurrentPage(prevIndex + 1);
    } else if (action === 'next' && currentPage < totalPages) {
      const nextIndex = currentPage;
      (scrollView.current.children[nextIndex] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setCurrentPage(nextIndex + 1);
    }
  };

  return (
    <>
      <div
        ref={scrollView}
        className="no-scrollbar flex snap-x snap-mandatory flex-row overflow-hidden dark:bg-gray-800 dark:text-white"
      >
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className="min-w-full min-h-full flex flex-col snap-start justify-around"
          >
            {reviews
              .slice(index * reviewsPerPage, (index + 1) * reviewsPerPage)
              .map((review) => (
                <SingleReview key={review._id} session={session} review={review} />
              ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-[24px]">
        <Button
          onClick={() => handlePageChange('prev')}
          size="icon"
          variant="ghost"
          disabled={currentPage === 1}
        >
          <Image className="rotate-180" src={leftArrow} alt="previous" height={24} width={24} />
        </Button>
        <p>
          {currentPage} of {totalPages}
        </p>
        <Button
          onClick={() => handlePageChange('next')}
          size="icon"
          variant="ghost"
          disabled={currentPage === totalPages}
        >
          <Image src={leftArrow} alt="next" height={24} width={24} />
        </Button>
      </div>
    </>
  );
}