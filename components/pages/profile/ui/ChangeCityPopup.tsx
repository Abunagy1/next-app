'use client';
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/local-ui/input';
import { updateCityAction } from '@/app/lib/actions/updateProfileActions';
import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChangeCityPopupState {
  success?: boolean;
  message?: string;
  error?: { city?: string };
}

export function ChangeCityPopup() {
  const [state, dispatch] = useActionState<ChangeCityPopupState, FormData>(updateCityAction, {});
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (state?.success) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'City updated successfully');
    }
    if (state?.success === false && state?.error) {
      toast.error(state.error.city || 'Failed to update city');
    }
  }, [state]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle>Change your city</DialogTitle>
          <DialogDescription>Update your city name.</DialogDescription>
          {state?.success === false && state?.message && <ErrorMessage message={state.message} />}
        </DialogHeader>
        <form id="change-city-form" action={dispatch} className="flex flex-col gap-4">
          <Input
            id="city-hsviuxwv"
            name="city"
            label="City"
            placeholder="Enter city"
            error={state?.error?.city}
            type="text"
            className="w-full"
          />
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button>Save</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will update your city.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild className="bg-destructive hover:bg-destructive/80">
                    <SubmitBtn formId="change-city-form" customTitle={{ default: 'Save', onSubmitting: 'Saving...' }} />
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}