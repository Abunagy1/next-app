'use client';

import { Input } from '../local-ui/input';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { SubmitBtn } from '../local-ui/SubmitBtn';
import LoginForm from '../pages/login/LoginForm';
import { SuccessMessage } from '../local-ui/successMessage';
import { ErrorMessage } from '../local-ui/errorMessage';
import { RatingStar } from '@/components/local-ui/ratingStar';
import { useRef, useEffect, useState } from 'react';

import writeReviewAction from '@/app/lib/actions/writeReviewAction';
import { useActionState } from 'react';
interface WriteReviewProps {
  isLoggedIn: boolean;
  isAlreadyReviewed: boolean;
  reviewKeys: any;
  userReviewObj: any;
  flightOrHotel?: 'flight' | 'hotel';
}
interface WriteReviewState {
  success?: boolean;
  message?: string;
  error?: {
    rating?: string;
    reviewComment?: string;
  };
}

export function WriteReview({
  isLoggedIn,
  isAlreadyReviewed,
  reviewKeys,
  userReviewObj,
  flightOrHotel = 'flight',
}: WriteReviewProps) {
  const extendedWriteReviewAction = writeReviewAction.bind(null, reviewKeys, isAlreadyReviewed, flightOrHotel);
  // const [state, dispatch] = useActionState(extendedWriteReviewAction, undefined);
  const reviewInput = useRef<HTMLDivElement>(null);
  const reviewBtn = useRef<HTMLButtonElement>(null);
  const [shouldMessageShow, setShouldMessageShow] = useState(false);
  // Inside the component:
  const [state, dispatch] = useActionState<WriteReviewState, FormData>(
    extendedWriteReviewAction,
    {}
  );
  useEffect(() => {
    queueMicrotask(() => setShouldMessageShow(true));
    const timer = setTimeout(() => setShouldMessageShow(false), 5000);
    return () => clearTimeout(timer);
  }, [state]);

  async function handleClick(action: 'reviewOpen' | 'reviewClose', e: React.MouseEvent) {
    const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));
    if (action === 'reviewOpen') {
      if (reviewInput.current) {
        reviewInput.current.classList.replace('hidden', 'block');
        await delay();
        reviewInput.current.classList.replace('opacity-0', 'opacity-100');
      }
      if (reviewBtn.current) reviewBtn.current.classList.replace('inline-block', 'hidden');
    } else {
      if (reviewInput.current) {
        reviewInput.current.classList.replace('opacity-100', 'opacity-0');
        await delay(200);
        reviewInput.current.classList.replace('block', 'hidden');
      }
      if (reviewBtn.current) reviewBtn.current.classList.replace('hidden', 'inline-block');
    }
  }

  return (
    <>
      <Button
        className="float-right inline-block opacity-100"
        onClick={(e) => handleClick('reviewOpen', e)}
        ref={reviewBtn}
      >
        {isLoggedIn ? (isAlreadyReviewed ? 'Edit Your Review' : 'Write Your review') : 'Sign in to write a review'}
      </Button>
      <div
        ref={reviewInput}
        className="transition-[duration:200ms] hidden w-full rounded-lg border p-3 opacity-0 transition-all"
      >
        <div className="my-4 flex justify-between">
          <h3 className="font-bold">
            {isLoggedIn ? (isAlreadyReviewed ? 'Edit Review' : 'Write a Review') : 'Sign in to write a review'}
          </h3>
          <X
            className="cursor-pointer rounded-sm border-black transition-all hover:border-2"
            onClick={(e) => handleClick('reviewClose', e)}
          />
        </div>
        {isLoggedIn ? (
          <>
            {shouldMessageShow && state?.success === true && state?.message && <SuccessMessage message={state.message} />}
            {shouldMessageShow && state?.success === false && state?.message && <ErrorMessage message={state.message} />}
            <form id="review-form" action={dispatch}>
              <div className="mb-5 flex flex-col gap-4">
                {/* <RatingStar fill="hsl(120, 33%, 10%)" error={state?.error?.rating} defaultRating={+userReviewObj?.rating ?? 0} /> */}
                <RatingStar
                  fill="hsl(120, 33%, 10%)"
                  error={state?.error?.rating}
                  defaultRating={userReviewObj?.rating ? +userReviewObj.rating : 0}
                />
              </div>
              <div className="mb-5">
                <Input
                  label="Comment"
                  type="textarea"
                  name="reviewComment"
                  defaultValue={userReviewObj?.comment ?? ''}
                  error={state?.error?.reviewComment}
                  className="leading-snug"
                />
              </div>
              <SubmitBtn formId="review-form" />
            </form>
          </>
        ) : (
          <LoginForm  />
        )}
      </div>
    </>
  );
}