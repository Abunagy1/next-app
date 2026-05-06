'use client';

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
import requestRefundFlightBookingAction from '@/app/lib/actions/requestRefundFlightBookingAction';
import { cn } from '@/app/lib/utils';
import { useState } from 'react';

interface RequestRefundFlightBtnProps {
  pnrCode: string;
  className?: string;
}

export default function RequestRefundFlightBtn({ pnrCode, className }: RequestRefundFlightBtnProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget;        // 👈 save the button here
    button.disabled = true;
    setIsSending(true);
    const res = await requestRefundFlightBookingAction(pnrCode);
    button.disabled = false;
    setIsSending(false);
    setOpen(false);
    if (res?.success === false) {
      toast.error(res.message || 'Failed to request refund');
    }
    if (res?.success === true) {
      toast.success(res.message || 'Refund requested successfully');
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          className={cn(
            'border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
            className,
          )}
          disabled={isSending}
          variant="outline"
          onClick={() => setOpen(true)}
        >
          Request Refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will request refund for your booking.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClick}
            className="bg-green-600 text-white hover:bg-green-600/90 focus:bg-green-600/90 active:bg-green-600/90 disabled:bg-disabled disabled:text-disabled-foreground"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}