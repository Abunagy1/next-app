import { Card, CardContent } from '@/components/ui/card';
import { TruncatedBadgeList } from '../../hotels.[bookingId]/TruncateBadgeList';
import { parseHotelCheckInOutPolicy } from '@/app/lib/helpers/hotels';
import { format } from 'date-fns';

interface HotelDetailsProps {
  hotel: {
    description?: string;
    amenities?: string[];
    features?: string[];
    policies?: {
      checkIn?: string;
      checkOut?: string;
      cancellationPolicy?: {
        cancellable?: boolean;
        cancellableUntil?: { unit: string; value: number };
        cancellationFee?: number;
      };
      refundPolicy?: {
        refundable?: boolean;
        refundFee?: number;
      };
      paymentPolicy?: {
        creditCards?: boolean;
        cash?: boolean;
      };
      childrenPolicy?: {
        allowed?: boolean;
        freeStayUnderAge?: number;
      };
      petPolicy?: {
        allowed?: boolean;
        petFee?: number | null;
      };
      smokingPolicy?: {
        allowed?: boolean;
        designatedAreasOnly?: boolean;
      };
    };
  };
}

export function HotelDetails({ hotel }: HotelDetailsProps) {
  const { description, amenities, features, policies } = hotel;

  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <div>
          <h2 className="mb-4 text-2xl font-bold dark:text-white">About this hotel</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Amenities and Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {amenities && amenities.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Amenities</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {amenities.slice(0, 10).map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
              {amenities.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  +{amenities.length - 10} more
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {features && features.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Features</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {features.slice(0, 10).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {features.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  +{features.length - 10} more
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Policies */}
      {policies && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-lg font-semibold dark:text-white">Policies</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {policies.checkIn && (
                <div>
                  <p className="font-medium dark:text-white">Check‑in</p>
                  <p className="text-gray-600 dark:text-gray-400">{policies.checkIn}</p>
                </div>
              )}
              {policies.checkOut && (
                <div>
                  <p className="font-medium dark:text-white">Check‑out</p>
                  <p className="text-gray-600 dark:text-gray-400">{policies.checkOut}</p>
                </div>
              )}
              {policies.cancellationPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Cancellation</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {policies.cancellationPolicy.cancellable ? 'Free cancellation' : 'Non‑refundable'}
                    {policies.cancellationPolicy.cancellableUntil && ` until ${policies.cancellationPolicy.cancellableUntil.value} ${policies.cancellationPolicy.cancellableUntil.unit} before check‑in`}
                    {policies.cancellationPolicy.cancellationFee ? ` (fee: $${policies.cancellationPolicy.cancellationFee})` : ''}
                  </p>
                </div>
              )}
              {policies.refundPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Refund</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {policies.refundPolicy.refundable ? 'Refundable' : 'Non‑refundable'}
                    {policies.refundPolicy.refundFee ? ` (fee: $${policies.refundPolicy.refundFee})` : ''}
                  </p>
                </div>
              )}
              {policies.paymentPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Payment methods</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {[
                      policies.paymentPolicy.creditCards && 'Credit cards',
                      policies.paymentPolicy.cash && 'Cash',
                    ].filter(Boolean).join(', ') || 'Not specified'}
                  </p>
                </div>
              )}
              {policies.childrenPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Children</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {policies.childrenPolicy.allowed ? 'Allowed' : 'Not allowed'}
                    {policies.childrenPolicy.freeStayUnderAge ? ` (free under ${policies.childrenPolicy.freeStayUnderAge} years)` : ''}
                  </p>
                </div>
              )}
              {policies.petPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Pets</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {policies.petPolicy.allowed ? 'Allowed' : 'Not allowed'}
                    {policies.petPolicy.petFee ? ` (fee: $${policies.petPolicy.petFee})` : ''}
                  </p>
                </div>
              )}
              {policies.smokingPolicy && (
                <div>
                  <p className="font-medium dark:text-white">Smoking</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {policies.smokingPolicy.allowed ? 'Allowed' : 'No smoking'}
                    {policies.smokingPolicy.designatedAreasOnly && ' (designated areas only)'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}