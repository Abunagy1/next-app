'use server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { revalidateTag } from 'next/cache';
import { strToObjectId } from '@/app/lib/db/utilsDB';
type FlightReviewKeys = {
  flightNumber: string;
  airlineId: string;
  departureAirportId: string;
  arrivalAirportId: string;
  airplaneModelName: string;
};

type HotelReviewKeys = {
  slug: string;
  hotelId: string;
};

type ReviewKeys = FlightReviewKeys | HotelReviewKeys;

export default async function writeReviewAction(
  reviewKeys: ReviewKeys,
  isAlreadyReviewed: boolean,
  flightOrHotel: 'flight' | 'hotel',
  prevState: any,
  formData: FormData
) {
  const ratingRaw = formData.get('rating');
  const reviewComment = formData.get('reviewComment') as string;

  const zodReviewSchema = z
    .object({
      rating: z
        .number()
        .gte(1, 'value have to be greater than or equal to 1')
        .lte(5, 'Value have to be less than or equal to 5'),
      reviewComment: z
        .string()
        .trim()
        .min(1, 'Empty field, Write something before sending'),
    })
    .safeParse({
      rating: parseFloat(parseFloat(ratingRaw as string).toFixed(1)),
      reviewComment,
    });

  if (!zodReviewSchema.success) {
    const errors: Record<string, string> = {};
    zodReviewSchema.error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }

  const session = await getServerSession(authOptions);
  const reviewer = strToObjectId(session?.user?.id);
  if (!reviewer) {
    return { success: false, message: 'You are not logged in' };
  }

  const reviewObj: any = {
    reviewer,
    rating: zodReviewSchema.data.rating,
    comment: zodReviewSchema.data.reviewComment,
  };

  // Add type‑specific fields and check for duplicate review
  if (flightOrHotel === 'flight') {
    const flightKeys = reviewKeys as FlightReviewKeys;
    reviewObj.airlineId = flightKeys.airlineId;
    reviewObj.departureAirportId = flightKeys.departureAirportId;
    reviewObj.arrivalAirportId = flightKeys.arrivalAirportId;
    reviewObj.airplaneModelName = flightKeys.airplaneModelName;

    const existing = await getOneDoc(
      'FlightReview',
      {
        reviewer: reviewObj.reviewer,
        airlineId: reviewObj.airlineId,
        departureAirportId: reviewObj.departureAirportId,
        arrivalAirportId: reviewObj.arrivalAirportId,
        airplaneModelName: reviewObj.airplaneModelName,
      },
      [reviewObj.reviewer + '_review', 'flightReviews', flightKeys.flightNumber + '_review'],
      false
    );
    if (
      existing &&
      Object.keys(existing).length &&
      +existing.rating === +reviewObj.rating &&
      existing.comment === reviewObj.comment
    ) {
      return {
        success: false,
        message: 'You are sending same review, Have some edit',
      };
    }
  } else if (flightOrHotel === 'hotel') {
    const hotelKeys = reviewKeys as HotelReviewKeys;
    reviewObj.hotelId = hotelKeys.hotelId;
    reviewObj.slug = hotelKeys.slug;

    const existing = await getOneDoc(
      'HotelReview',
      {
        reviewer: reviewObj.reviewer,
        hotelId: reviewObj.hotelId,
        slug: reviewObj.slug,
      },
      [
        reviewObj.reviewer + '_review',
        'hotelReviews',
        hotelKeys.hotelId + '_review',
        hotelKeys.slug + '_review',
      ],
      false
    );
    if (
      existing &&
      Object.keys(existing).length &&
      +existing.rating === +reviewObj.rating &&
      existing.comment === reviewObj.comment
    ) {
      return {
        success: false,
        message: 'You are sending same review, Have some edit',
      };
    }
  }

  // Determine model and filter for update
  let dbModel: 'FlightReview' | 'HotelReview';
  let dbOperationFilterObj: any;
  if (flightOrHotel === 'flight') {
    dbModel = 'FlightReview';
    const flightKeys = reviewKeys as FlightReviewKeys;
    dbOperationFilterObj = {
      reviewer: reviewObj.reviewer,
      airlineId: flightKeys.airlineId,
      departureAirportId: flightKeys.departureAirportId,
      arrivalAirportId: flightKeys.arrivalAirportId,
      airplaneModelName: flightKeys.airplaneModelName,
    };
  } else {
    dbModel = 'HotelReview';
    const hotelKeys = reviewKeys as HotelReviewKeys;
    dbOperationFilterObj = {
      reviewer: reviewObj.reviewer,
      hotelId: hotelKeys.hotelId,
      slug: hotelKeys.slug,
    };
  }

  try {
    if (isAlreadyReviewed) {
      await updateOneDoc(dbModel, dbOperationFilterObj, {
        rating: reviewObj.rating,
        comment: reviewObj.comment,
      });
    } else {
      await createOneDoc(dbModel, { ...reviewObj, flagged: [] });
    }
    return { success: true, message: 'Thanks for the review' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message };
  } finally {
    if (flightOrHotel === 'flight') {
      const flightKeys = reviewKeys as FlightReviewKeys;
      revalidateTag(flightKeys.flightNumber + '_review', {});
    } else {
      const hotelKeys = reviewKeys as HotelReviewKeys;
      revalidateTag(hotelKeys.slug + '_review', {});
    }
  }
}