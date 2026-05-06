'use client';
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/local-ui/input';
import { updateAboutAction } from '@/app/lib/actions/updateProfileActions';
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

interface ChangeAboutPopupState {
  success?: boolean;
  message?: string;
  error?: { about?: string };
}

export function ChangeAboutPopup() {
  const [state, dispatch] = useActionState<ChangeAboutPopupState, FormData>(updateAboutAction, {});
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (state?.success) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'About updated successfully');
    }
    if (state?.success === false && state?.error) {
      toast.error(state.error.about || 'Failed to update about');
    }
  }, [state]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle>Change your About</DialogTitle>
          <DialogDescription>Tell something about yourself.</DialogDescription>
          {state?.success === false && state?.message && <ErrorMessage message={state.message} />}
        </DialogHeader>
        <form id="change-about-form" action={dispatch} className="flex flex-col gap-4">
          <Input
            id="about-hsviuxwv"
            name="about"
            label="About"
            placeholder="Write something about you..."
            error={state?.error?.about}
            type="textarea"
            className="w-full"
          />
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button>Save</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will update your about section.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild className="bg-destructive hover:bg-destructive/80">
                    <SubmitBtn formId="change-about-form" customTitle={{ default: 'Save', onSubmitting: 'Saving...' }} />
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