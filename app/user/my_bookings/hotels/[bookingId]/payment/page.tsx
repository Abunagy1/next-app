import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import routes from '@/data/routes.json';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import HotelBookingPayment from '@/components/pages/hotels.book/HotelBookingPayment';

export default async function HotelPaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user?.id;

  if (!loggedIn) {
    return redirect(
      routes.login.path +
        '?callbackPath=' +
        encodeURIComponent(`/user/my_bookings/hotels/${bookingId}`)
    );
  }

  let bookingData: any;
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT * FROM hotel_bookings WHERE id = ${bookingId} AND user_id = ${session.user.id}
    `;
    if (rows.length === 0) notFound();
    bookingData = rows[0];

    // Parse any JSON string columns (rooms, guests)
    if (typeof bookingData.rooms === 'string') {
      try { bookingData.rooms = JSON.parse(bookingData.rooms); } catch { bookingData.rooms = []; }
    }
    if (typeof bookingData.guests === 'string') {
      try { bookingData.guests = JSON.parse(bookingData.guests); } catch { bookingData.guests = []; }
    }
  } else {
    bookingData = await getOneDoc(
      'HotelBooking',
      { _id: strToObjectId(bookingId), userId: strToObjectId(session.user.id) },
      ['hotelBooking']
    );
    if (!bookingData || Object.keys(bookingData).length === 0) notFound();
  }

  // Fetch hotel to get slug
  let hotelData: any;
  if (dbType === 'postgres') {
    const rows = await sql`SELECT slug FROM hotels WHERE id = ${bookingData.hotel_id}`;
    if (rows.length === 0) notFound();
    hotelData = rows[0];
  } else {
    hotelData = await getOneDoc('Hotel', { _id: strToObjectId(bookingData.hotel_id) }, ['hotel']);
    if (!hotelData || Object.keys(hotelData).length === 0) notFound();
  }

  const slug = hotelData.slug;
  const checkInDate = bookingData.check_in_date || bookingData.checkInDate;
  const checkOutDate = bookingData.check_out_date || bookingData.checkOutDate;

  // Force the component to be treated as any to bypass type issues
  const PaymentComponent = HotelBookingPayment as React.ComponentType<any>;

  return (
    <main className="mx-auto mb-[80px] mt-7 w-[90%] text-secondary">
      <PaymentComponent slug={slug} checkInDate={checkInDate} checkOutDate={checkOutDate} />
    </main>
  );
}