import 'server-only';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getManyDocs } from '@/app/lib/db/getOperationDB';
import { Separator } from '../ui/separator';
import { FlightOrHotelReviewList } from './FlightOrHotelReviewList';
import { WriteReview } from './writeReview';
import { RATING_SCALE } from '@/app/lib/constants';
import { flightRatingCalculation } from '@/app/lib/helpers/flights/flightRatingCalculation';
import { cn } from '@/app/lib/utils';
import { sql, dbType, connectDB } from '@/app/lib/db/index';

interface FlightOrHotelReviewProps {
  reviewType: 'flight' | 'hotel';
  data: any;
  className?: string;
}

export default async function FlightOrHotelReview({
  reviewType = 'flight',
  data,
  className,
  ...props
}: FlightOrHotelReviewProps) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  let reviews: any[] = [];
  let userReviewObj: any = {};
  let rating = 0;
  let reviewsCount = 0;
  let isAlreadyReviewed = false;
  let reviewKeys: any = {};

  if (reviewType === 'flight') {
    const segment = data.segments[0];
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT * FROM flight_reviews
        WHERE airline_id = ${segment.airlineId}
          AND departure_airport_id = ${segment.from.airport._id}
          AND arrival_airport_id = ${segment.to.airport._id}
          AND airplane_model_name = ${segment.airplaneId.model}
      `;
      reviews = rows;
    } else {
      await connectDB();
      reviews = await getManyDocs('FlightReview', {
        airlineId: segment.airlineId._id,
        departureAirportId: segment.from.airport._id,
        arrivalAirportId: segment.to.airport._id,
        airplaneModelName: segment.airplaneId.model,
      }, [data.flightNumber + '_review', 'flightReviews']);
    }
    reviewsCount = reviews.length;
    userReviewObj = reviews.find((review) => review.reviewer?.toString() === session?.user?.id);
    rating = flightRatingCalculation(reviews);
    isAlreadyReviewed = reviews.some((review) => review.reviewer?.toString() === session?.user?.id);
    reviewKeys = {
      flightNumber: data.flightNumber,
      airlineId: segment.airlineId._id || segment.airlineId,
      departureAirportId: segment.from.airport._id,
      arrivalAirportId: segment.to.airport._id,
      airplaneModelName: segment.airplaneId.model,
    };
  } else {
    if (dbType === 'postgres') {
      const rows = await sql`SELECT * FROM hotel_reviews WHERE slug = ${data.slug}`;
      reviews = rows;
    } else {
      await connectDB();
      reviews = await getManyDocs('HotelReview', { slug: data.slug }, [data.slug + '_review', 'hotelReviews']);
    }
    reviewsCount = reviews.length;
    userReviewObj = reviews.find((review) => review.reviewer?.toString() === session?.user?.id);
    const totalRate = reviews.reduce((acc, review) => acc + +review.rating, 0);
    rating = totalRate / (reviewsCount || 1);
    isAlreadyReviewed = reviews.some((review) => review.reviewer?.toString() === session?.user?.id);
    reviewKeys = { slug: data.slug, hotelId: data._id };
  }

  return (
    <div className={cn('rounded-[12px] bg-white px-6 py-8 shadow-lg dark:bg-gray-800 dark:text-white', className)} {...props}>
      <div className="mb-[32px]">
        <h2 className="inline-block text-2xl font-bold">Reviews</h2>
        <WriteReview
          userReviewObj={userReviewObj}
          isLoggedIn={isLoggedIn}
          isAlreadyReviewed={isAlreadyReviewed}
          reviewKeys={reviewKeys}
          flightOrHotel={reviewType}
        />
      </div>
      <div className="flex items-end gap-[16px]">
        <p className="text-4xl font-bold">{rating ? rating.toFixed(1) : 'N/A'}</p>
        <p className="inline-flex items-center gap-3">
          <span className="text-lg font-semibold">
            {rating ? RATING_SCALE[Math.floor(rating) as keyof typeof RATING_SCALE] : 'N/A'}
          </span>
          <span className="text-sm">{reviewsCount}&nbsp; verified reviews</span>
        </p>
      </div>
      <Separator />
      <div>
        {reviews.length > 0 ? (
          <FlightOrHotelReviewList session={session} reviews={reviews} />
        ) : (
          <p className="flex h-52 items-center justify-center text-center text-xl font-bold">No reviews yet</p>
        )}
      </div>
    </div>
  );
}