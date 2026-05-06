'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import cancelFlightBookingAction from '@/app/lib/actions/cancelFlightBookingAction';
import { useRouter } from 'next/navigation';

interface CancelFlightBtnProps {
  pnrCode: string;
  className?: string;
}

export default function CancelFlightBtn({ pnrCode, className }: CancelFlightBtnProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  async function handleClick() {
    if (!buttonRef.current) return;
    buttonRef.current.disabled = true;
    setIsSending(true);

    const res = await cancelFlightBookingAction(pnrCode);

    if (buttonRef.current) {
      buttonRef.current.disabled = false;
    }
    setIsSending(false);
    setOpen(false);

    if (res?.success === false) {
      toast.error(res.message || 'Failed to cancel booking');
    }
    if (res?.success === true) {
      toast.success(res.message || 'Booking cancelled successfully');
      router.push('/user/my_bookings');        // navigate to the list and re‑fetch
      // Force a hard refresh so the page re‑fetches fresh data
      router.refresh();
      // As a fallback, also reload after a short delay
      setTimeout(() => window.location.reload(), 500);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          ref={buttonRef}
          variant="destructive"
          disabled={isSending}
          className={className}
        >
          Cancel Booking
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will cancel your booking.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClick}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}