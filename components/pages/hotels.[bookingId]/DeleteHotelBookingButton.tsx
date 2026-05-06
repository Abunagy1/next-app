'use client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteHotelBookingAction } from '@/app/lib/actions/deleteHotelBookingAction';
import { useRouter } from 'next/navigation'
export function DeleteHotelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm('Permanently delete this booking?')) return;
    const res = await deleteHotelBookingAction(bookingId);
    if (res?.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res?.message || 'Delete failed');
    }
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}