// components/pages/user.my_bookings.hotels.[bookingId].invoice/HotelBookingInvoice.tsx

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/app/lib/utils";
import { format } from "date-fns";
import DownloadInvoiceButton from "./ui/DownloadInvoiceButton";

interface HotelBookingInvoiceProps {
  bookingDetails: any;
  hotelDetails: any;
  userDetails: any;
}

export default function HotelBookingInvoice({
  bookingDetails: hotelBooking,
  hotelDetails,
  userDetails,
}: HotelBookingInvoiceProps) {
  const bookingId = hotelBooking._id;
  const fareBreakdowns = hotelBooking.fareBreakdown;
  const total = formatCurrency(hotelBooking.totalPrice);

  const statusColors: Record<string, string> = {
    confirmed: "text-green-700 dark:text-green-400",
    paid: "text-green-700 dark:text-green-400",
    pending: "text-yellow-700 dark:text-yellow-400",
    cancelled: "text-red-700 dark:text-red-400",
    failed: "text-red-700 dark:text-red-400",
    refunded: "text-red-700 dark:text-red-400",
  };

  const bookingData = {
    bookingId: hotelBooking._id,
    bookingDate: hotelBooking.bookedAt,
    status: hotelBooking.bookingStatus,
    paymentStatus: hotelBooking.paymentStatus,
    hotel: {
      name: hotelDetails.name,
      address:
        hotelDetails.address.streetAddress +
        ", " +
        hotelDetails.address.city +
        ", " +
        hotelDetails.address.country,
      phone: hotelDetails?.contact?.phone,
      email: hotelDetails?.contact?.email,
      supportEmail: hotelDetails?.contact?.supportEmail,
      supportPhone: hotelDetails?.contact?.supportPhone,
      logo: hotelDetails?.logo,
    },
  };

  let phoneList: any[] = [];
  if (Array.isArray(userDetails?.phoneNumbers)) {
    phoneList = userDetails.phoneNumbers;
  } else if (typeof userDetails?.phoneNumbers === "string") {
    try {
      const parsed = JSON.parse(userDetails.phoneNumbers);
      if (Array.isArray(parsed)) phoneList = parsed;
    } catch (e) {
      console.log(e);
    }
  }

  const userPhone = phoneList.find((phone: any) => phone.primary);
  const userPhoneNumber = userPhone
    ? userPhone.dialCode + userPhone.number
    : "";
  const userFullName = `${userDetails.firstName} ${userDetails.lastName}`;
  const hotel = bookingData.hotel;
  const bookingDate = bookingData.bookingDate;
  const status = bookingData.status;

  return (
    <div className="mx-auto max-w-[840px]">
      <div className="mb-2 flex justify-end">
        <DownloadInvoiceButton documentId="hotel-invoice" bookingId={bookingId} />
      </div>

      <div
        id="hotel-invoice"
        className="space-y-6 border bg-white p-6 print:max-w-full print:border-none print:p-0 print:shadow-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      >
        <header className="flex items-start justify-between border-b pb-4 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Invoice</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Booking ID: {bookingId}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Issued: {bookingDate ? format(new Date(bookingDate), "PPP") : "—"}
            </p>
          </div>
        </header>

        <Card className="dark:bg-gray-700 dark:border-gray-600">
          <CardContent className="p-5">
            <h2 className="mb-2 text-lg font-semibold dark:text-white">
              Hotel Information
            </h2>
            <p className="font-medium dark:text-gray-100">{hotel.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{hotel.address}</p>
            {hotel.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Phone: {hotel.phone}
              </p>
            )}
            {hotel.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email: {hotel.email}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-700 dark:border-gray-600">
          <CardContent className="p-5 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">
              Booking Status:{" "}
              <span className={cn("mb-1 text-sm font-semibold capitalize", statusColors[status])}>
                {status}
              </span>
            </p>
            <p className="font-medium">
              Payment Status:{" "}
              <span className={cn("text-sm font-semibold capitalize", statusColors[bookingData.paymentStatus])}>
                {bookingData.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </span>
            </p>
            <p className="font-bold capitalize">
              <span className="font-medium">Payment Method:</span>{" "}
              {hotelBooking.paymentMethod || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-700 dark:border-gray-600">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-lg font-semibold dark:text-white">Fare Breakdown</h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px] overflow-hidden rounded-lg border border-gray-200 text-left text-sm text-gray-700 dark:border-gray-500">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                  <tr>
                    <th className="px-4 py-2">Room Type</th>
                    <th className="px-4 py-2">Bed Option</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Base</th>
                    <th className="px-4 py-2 text-right">Tax</th>
                    <th className="px-4 py-2 text-right">Service</th>
                    <th className="px-4 py-2 text-right">Discount</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fareBreakdowns).map(([roomType, bedOptions]: any) =>
                    Object.entries(bedOptions).map(([bedOption, breakdown]: any) => {
                      const base = Number(breakdown.base) || 0;
                      const tax = Number(breakdown.tax) || 0;
                      const serviceFee = Number(breakdown.serviceFee) || 0;
                      const discount = Number(breakdown.discount) || 0;
                      const subtotal = Number(breakdown.total) || 0;

                      return (
                        <tr key={`${roomType}-${bedOption}`} className="border-t dark:border-gray-500">
                          <td className="px-4 py-2 dark:text-gray-200">{roomType}</td>
                          <td className="px-4 py-2 dark:text-gray-200">{bedOption}</td>
                          <td className="px-4 py-2 text-center dark:text-gray-200">
                            {breakdown.rooms.length}
                          </td>
                          <td className="px-4 py-2 text-right dark:text-gray-200">
                            {formatCurrency(base)}
                          </td>
                          <td className="px-4 py-2 text-right dark:text-gray-200">
                            {formatCurrency(tax)}
                          </td>
                          <td className="px-4 py-2 text-right dark:text-gray-200">
                            {formatCurrency(serviceFee)}
                          </td>
                          <td className="px-4 py-2 text-right dark:text-gray-200">
                            -{formatCurrency(discount)}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold dark:text-white">
                            {formatCurrency(subtotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-600">
                  <tr className="border-t dark:border-gray-500">
                    <td className="px-4 py-2 font-semibold dark:text-gray-200" colSpan={7}>
                      Total
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(Number(hotelBooking.totalPrice) || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-700 dark:border-gray-600">
          <CardContent className="p-5">
            <h2 className="mb-2 text-lg font-semibold dark:text-white">Billed To</h2>
            <p className="font-medium dark:text-gray-100">{userFullName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{userDetails.email}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{userPhoneNumber}</p>
          </CardContent>
        </Card>

        {hotel.supportEmail && hotel.supportPhone && (
          <footer className="mt-6 border-t pt-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-400">
            <p>
              For payment-related inquiries, contact{" "}
              <strong>{hotel.supportEmail}</strong> or call{" "}
              <strong>{hotel.supportPhone}</strong>.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}