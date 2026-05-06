'use client';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/local-ui/input';
import { updateEmailAction } from '@/app/lib/actions/updateProfileActions';

import { useActionState } from "react";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { ChangeButton } from './ChangeButton';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface Email {
  email: string;
  primary: boolean;
  emailVerifiedAt?: string | null;
  inVerification?: boolean;
}

interface ChangeEmailPopupState {
  success?: boolean;
  message?: string;
  error?: {
    email?: string;
  };
}

interface ChangeEmailPopupProps {
  emails: Email[];
}

export function ChangeEmailPopup({ emails }: ChangeEmailPopupProps) {
  const [state, dispatch] = useActionState<ChangeEmailPopupState, FormData>(
    updateEmailAction,
    {}
  );
  // const [state, dispatch] = useActionState(
  //   (prevState: ChangeEmailPopupState, formData: FormData) => updateEmailAction(prevState, formData),
  //   {} as ChangeEmailPopupState
  // );
  // const [state, dispatch] = useActionState<ChangeEmailPopupState>(updateEmailAction as any, {});
  const [opened, setOpened] = useState(false);
  const [isEmailsEdited, setIsEmailsEdited] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const obj: Record<string, boolean> = {};
    emails?.forEach((email) => {
      obj[email.email] = false;
    });
    queueMicrotask(() => setIsEmailsEdited(obj));
  }, [emails]);

  useEffect(() => {
    if (state?.success === true) {
      queueMicrotask(() => setOpened(false));
      toast.success(state.message || 'Email updated successfully');
    }
  }, [state]);

  function handleEditEmail(email: string) {
    const obj = { ...isEmailsEdited };
    Object.keys(obj).forEach((key) => {
      obj[key] = key === email;
    });
    setIsEmailsEdited(obj);
  }

  function handleCancelEditEmail(email: string) {
    setIsEmailsEdited({
      ...isEmailsEdited,
      [email]: false,
    });
  }

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <ChangeButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80%] flex flex-col dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Update your email</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Make changes to your email here. Click save when you&apos;re done.
          </DialogDescription>
          {state?.success === false && state?.message && (
            <ErrorMessage message={state.message} />
          )}
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-y-auto goBye-scrollbar pr-2 pt-2">
          {emails?.map((email, i) => (
            <div key={i}>
              {isEmailsEdited[email.email] ? (
                <form
                  id={email.email}
                  action={dispatch}
                  className="flex justify-start items-start flex-col gap-2"
                >
                  <input type="hidden" name="prevEmail" value={email.email} />
                  <Input
                    type="email"
                    name="email"
                    defaultValue={email.email}
                    label="Email"
                    error={state?.error?.email}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <SubmitBtn formId={email.email} />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleCancelEditEmail(email.email)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{email.email}</p>
                  {email.primary === true && (
                    <p className="text-sm font-semibold text-muted-foreground">Primary</p>
                  )}
                  {email.primary === false && (
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => handleEditEmail(email.email)}
                    >
                      <Edit />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}