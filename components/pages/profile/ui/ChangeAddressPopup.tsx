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
import { updateAddressAction } from '@/app/lib/actions/updateProfileActions';
import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';
import { Button } from '@/components/ui/button';

interface ChangeAddressPopupState {
  success?: boolean;
  message?: string;
  error?: {
    address?: string;
  };
}

export function ChangeAddressPopup() {
  const [state, dispatch] = useActionState<ChangeAddressPopupState, FormData>(
    updateAddressAction,
    {}
  );
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangeAddressPopupState, formData: FormData) => updateAddressAction(prevState, formData),
  //   {} as ChangeAddressPopupState
  // );
  // const [state, dispatch] = useActionState<any>(updateAddressAction as any, {});
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (state?.success === true) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Address updated successfully');
    }
    if (state?.success === false && state?.error) {
      toast.error(state.error.address || 'Failed to update address');
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
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Change your address</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            It is recommended not to save real address here.
          </DialogDescription>
          {state?.success === false && state?.message && (
            <ErrorMessage message={state.message} />
          )}
        </DialogHeader>
        <form
          id="change-address-form"
          className="flex flex-col gap-4"
          action={dispatch}
          onSubmit={handleSubmit}
        >
          <div className="flex">
            <Input
              id="address-hsviuxwv"
              name="address"
              label="Address"
              placeholder="Enter address"
              error={state?.error?.address}
              type="textarea"
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
                    It is recommended not to save real address here.
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
                      formId="change-address-form"
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