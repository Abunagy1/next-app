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
import { updateDateOfBirthAction } from '@/app/lib/actions/updateProfileActions';

import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';
import { Button } from '@/components/ui/button';

interface ChangeDateOfBirthPopupState {
  success?: boolean;
  message?: string;
  error?: {
    dateOfBirth?: string;
  };
}

export function ChangeDateOfBirthPopup() {
  const [state, dispatch] = useActionState<ChangeDateOfBirthPopupState, FormData>(
    updateDateOfBirthAction,
    {}
  );
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangeDateOfBirthPopupState, formData: FormData) => updateDateOfBirthAction(prevState, formData),
  //   {} as ChangeDateOfBirthPopupState
  // );
  // const [state, dispatch] = useActionState<any>(updateDateOfBirthAction as any, {});
  const [opened, setOpened] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (state?.success === true) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Date of birth updated successfully');
    }
    if (state?.success === false && state?.error) {
      toast.error(state.error.dateOfBirth || 'Failed to update date of birth');
    }
  }, [state]);

  const handleSubmit = () => {
    toast.info('Saving... Please wait while we save your changes.');
  };

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Change your date of birth</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            It is recommended not to save real date of birth here.
          </DialogDescription>
          {state?.success === false && state?.message && (
            <ErrorMessage message={state.message} />
          )}
        </DialogHeader>
        <form
          id="change-dateOfBirth-form"
          className="flex flex-col gap-4"
          action={dispatch}
          onSubmit={handleSubmit}
        >
          <div className="flex justify-center">
            <Input
              id="dateOfBirth-hsviuxwv"
              name="dateOfBirth"
              label="Date of Birth"
              placeholder="Enter date of birth"
              error={state?.error?.dateOfBirth}
              defaultValue={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              type="date"
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
                    It is recommended not to save real date of birth here.
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
                      formId="change-dateOfBirth-form"
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