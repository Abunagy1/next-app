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
import { updateNameAction } from '@/app/lib/actions/updateProfileActions';
import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';

interface ChangeNamePopupState {
  success?: boolean;
  message?: string;
  error?: Record<string, string>;
}

interface ChangeNamePopupProps {
  firstname: string;
  lastname: string;
}

export function ChangeNamePopup({ firstname, lastname }: ChangeNamePopupProps) {
  const [state, dispatch] = useActionState<ChangeNamePopupState, FormData>(
    updateNameAction,
    {}
  );
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangeNamePopupState, formData: FormData) => updateNameAction(prevState, formData),
  //   {} as ChangeNamePopupState
  // );
  // const [state, dispatch] = useActionState<ChangeNamePopupProps>(updateNameAction as any, {});
  const [opened, setOpened] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state?.success === false && state?.error) {
      queueMicrotask(() => setErrors(state.error!));
    }
    if (state?.success) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Name updated successfully');
    }
  }, [state]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Edit name</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
          {state?.success === false && !state?.error && (
            <ErrorMessage message={state?.message || 'Failed to update name'} />
          )}
        </DialogHeader>
        <form id="change-name-form" action={dispatch}>
          <div className="grid gap-4 py-4">
            <Input
              id="firstname-hsviuxwv"
              name="firstName"
              label="First name"
              defaultValue={firstname}
              error={errors?.firstName}
            />
            <Input
              id="lastname-sjvch"
              label="Last name"
              name="lastName"
              defaultValue={lastname}
              error={errors?.lastName}
            />
          </div>
          <DialogFooter>
            <SubmitBtn
              customTitle={{ default: 'Save', onSubmitting: 'Saving...' }}
              formId="change-name-form"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}