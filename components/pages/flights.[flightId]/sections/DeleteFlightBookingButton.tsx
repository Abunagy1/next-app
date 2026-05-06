'use client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteFlightBookingAction } from '@/app/lib/actions/deleteFlightBookingAction';
import { useRouter } from 'next/navigation';
export function DeleteFlightBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm('Permanently delete this cancelled booking?')) return;
    const res = await deleteFlightBookingAction(bookingId);
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