'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingStar } from '@/components/local-ui/ratingStar';
import { Input } from '../local-ui/input';
import submitWebsiteReviewsAction from '@/app/lib/actions/submitWebsiteReviewsAction';
import { toast } from 'sonner';
import { cn } from '@/app/lib/utils';

export default function WebsiteReviewForm() {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('overall');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'customer_support', label: 'Customer Support' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'reliability', label: 'Reliability' },
    { value: 'communication', label: 'Communication' },
    { value: 'overall', label: 'Overall' },
  ];

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.disabled = true;
    const reviewData = { rating, category, comment };
    const res = await submitWebsiteReviewsAction(reviewData);
    e.currentTarget.disabled = false;
    if (!res.success) {
      setErrors(res.error || {});
      toast.error(res.message || 'Failed to submit review');
      return;
    }
    setRating(0);
    setCategory('overall');
    setComment('');
    setErrors({});
    toast.success(res.message || 'Review submitted');
  };

  return (
    <Card className="mx-auto mt-6 max-w-md rounded-2xl shadow-lg">
      <CardContent className="space-y-4 p-6">
        <h2 id="website_review_form_title" className="text-center text-xl font-semibold">
          Share Your Website Experience
        </h2>
        <div className="flex justify-center space-x-1">
          <RatingStar
            width={32}
            height={32}
            onValueChange={setRating}
            fill="#ffd700"
            error={errors.rating}
            defaultRating={rating}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            className={cn(
              'mt-1 w-full border-2 border-black dark:border-gray-600',
              'bg-white dark:bg-gray-700',
              'text-gray-900 dark:text-gray-100',
              'focus:ring-2 focus:ring-primary',
              errors.category && 'border-destructive'
            )}
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 dark:border-gray-600">
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
          <p className="pl-3 text-sm font-medium text-destructive">{errors.category}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Comment (optional)</label>
          <Input
            name="comment"
            label=""
            error={errors.comment}
            type="textarea"
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="mt-1"
          />
        </div>
        <Button onClick={handleSubmit} className="mt-4 w-full">
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}