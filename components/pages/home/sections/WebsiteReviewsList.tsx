"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ReviewsCard } from "../ui/ReviewsCard";

interface Review {
  id: string;
  comment: string;
  rate: number;
  reviewer: string;
  image?: string;
}

interface WebsiteReviewsListProps {
  reviews?: Review[];
}

export function WebsiteReviewsList({ reviews = [] }: WebsiteReviewsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? -300 : -400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 300 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={scrollLeft}
        className="absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-2xl focus:outline-none dark:bg-gray-700 dark:border-gray-600"
      >
        <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-2xl focus:outline-none dark:bg-gray-700 dark:border-gray-600"
      >
        <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex items-center gap-8 overflow-x-auto px-6 py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((review, index) => (
          <div key={review.id || `review-${index}`}>
            <ReviewsCard
              comment={review.comment}
              rate={review.rate}
              reviewer={review.reviewer}
              profileImage={review.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}