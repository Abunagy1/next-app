'use client';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/local-ui/input';
import { updatePhoneAction } from '@/app/lib/actions/updateProfileActions';
import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';
import { Button } from '@/components/ui/button';

interface ChangePhonePopupState {
  success?: boolean;
  message?: string;
  error?: {
    phone?: string;
  };
}

export function ChangePhonePopup() {
  const [state, dispatch] = useActionState<ChangePhonePopupState>(updatePhoneAction as any, {});
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangePhonePopupState, formData: FormData) => updatePhoneAction(prevState, formData),
  //   {} as ChangePhonePopupState
  // );
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (state?.success === true) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Phone number updated successfully');
    }
    if (state?.success === false && state?.error) {
      toast.error(state.error.phone || 'Failed to update phone number');
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    toast.info('Saving... Please wait while we save your changes.');
  };

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="z-[99] overflow-visible sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Change your phone number</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            It is recommended not to save real phone number here.
          </DialogDescription>
          {state?.success === false && state?.message && (
            <ErrorMessage message={state.message} />
          )}
        </DialogHeader>
        <form
          id="change-phone-form"
          className="flex flex-col gap-4"
          action={dispatch}
          onSubmit={handleSubmit}
        >
          <div className="flex">
            <Input
              id="phone-hsviuxwv"
              name="phone"
              label="Phone Number"
              placeholder="Enter phone number"
              dialCodePlaceholder="+XXX"
              error={state?.error?.phone}
              type="tel"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Save</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It is recommended not to save real phone number here.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-primary">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    asChild
                    className="bg-destructive hover:bg-destructive/80"
                  >
                    <SubmitBtn
                      type="submit"
                      customTitle={{
                        default: 'Continue',
                        onSubmitting: 'Saving...',
                      }}
                      formId="change-phone-form"
                    />
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