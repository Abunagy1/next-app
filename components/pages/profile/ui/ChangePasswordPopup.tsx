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
import { Input } from '@/components/local-ui/input';
import { updatePasswordAction } from '@/app/lib/actions/updateProfileActions';
import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';

interface ChangePasswordPopupState {
  success?: boolean;
  message?: string;
  error?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

export function ChangePasswordPopup() {
  const [state, dispatch] = useActionState<ChangePasswordPopupState, FormData>(
    updatePasswordAction,
    {}
  );
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangePasswordPopupState, formData: FormData) => updatePasswordAction(prevState, formData),
  //   {} as ChangePasswordPopupState
  // );
  // const [state, dispatch] = useActionState<ChangePasswordPopupState>(updatePasswordAction as any, {});
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (state?.success === true) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Password updated successfully');
    }
  }, [state]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Update your password</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Make changes to your password here. Click save when you&apos;re done.
          </DialogDescription>
          {state?.success === false && state?.message && (
            <ErrorMessage message={state.message} />
          )}
        </DialogHeader>
        <form id="change-password-form" action={dispatch}>
          <div className="grid gap-4 py-4">
            <Input
              id="currentPassword-hsviuxwv"
              name="currentPassword"
              label="Current Password"
              placeholder="Enter your current password"
              error={state?.error?.currentPassword}
              type="password"
            />
            <Input
              id="newPassword-sjvch"
              label="New Password"
              name="newPassword"
              placeholder="Enter new password"
              error={state?.error?.newPassword}
              type="password"
            />
            <Input
              id="confirmPassword-sjvch"
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Enter new password again"
              error={state?.error?.confirmPassword}
              type="password"
            />
          </div>
          <DialogFooter>
            <SubmitBtn
              customTitle={{ default: 'Save', onSubmitting: 'Saving...' }}
              formId="change-password-form"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}