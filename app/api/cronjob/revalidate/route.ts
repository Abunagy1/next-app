import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

  // const authHeader = req.headers.get('Authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   //return new Response('Unauthorized', { status: 401 });
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    // List of all cache tags used across the application
    const tagsToRevalidate = [
      'popularFlightDestinations',
      'popularHotelDestinations',
      'websiteReviews',
      'websiteReviewsStats',
      'flightDateRange',
      'userDetails',
      'userFlightBooking',
      'hotelBookings',
      'flightSeat',
      'airports',
      'flights',
      'hotels',
      'hotelBookings',
      // Add any additional tags you have defined in your `unstable_cache` calls
    ];
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, {});
    }
    console.log('[revalidate] Revalidated tags:', tagsToRevalidate);
    return NextResponse.json({ success: true, message: 'Revalidated' });
  } catch (error: any) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

