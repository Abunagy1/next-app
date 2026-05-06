'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarProps {
  width?: number;
  height?: number;
  onValueChange?: (rating: number) => void;
  error?: string;
  defaultRating?: number;
  fill?: string;
}

export function RatingStar({
  width = 24,
  height = 24,
  onValueChange = () => {},
  error,
  defaultRating = 0,
  fill = 'currentColor',
}: RatingStarProps) {
  const [rating, setRating] = useState(defaultRating);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={width}
            height={height}
            className={`cursor-pointer transition-colors ${
              (hover || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => {
              setRating(star);
              onValueChange(star);
            }}
          />
        ))}
      </div>
      <input type="hidden" name="rating" value={rating} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}