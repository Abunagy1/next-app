'use client';
import { useActionState } from 'react';
import { deleteAccountAction } from '@/app/lib/actions/deleteAccountAction';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/local-ui/input';
import { ErrorMessage } from '@/components/local-ui/errorMessage';
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { toast } from 'sonner';

interface DeleteAccountState {
  success?: boolean;
  message?: string;
  error?: {
    primaryEmail?: string;
    password?: string;
    delete?: string;
  };
}
export default function DeleteAccountSection() {
  const [state, dispatch, isPending] = useActionState<DeleteAccountState, FormData>(
    deleteAccountAction as any,
    {}
  );
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (state?.success === true) {
      toast.success(state.message || 'Account deleted');
      setTimeout(() => window.location.reload(), 2000);
    }
  }, [state]);

  return (
    <Card >
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl font-semibold text-red-600">Delete Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      {/* <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2> */}
        <p className="text-sm text-muted-foreground">
          Deleting your account is irreversible. All your data will be permanently removed.
        </p>
        {!showForm ? (
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2" onClick={() => setShowForm(true)}>
            Delete Account
          </Button>
        ) : (
          <form id="delete-account-form" action={dispatch} className="space-y-4">
            {state?.success === false && state?.message && (
              <ErrorMessage message={state.message} />
            )}
            <Input
              id="primaryEmail"
              name="primaryEmail"
              label="Primary Email"
              placeholder="Enter your primary email"
              type="email"
              error={state?.error?.primaryEmail}
              className="w-full dark:bg-gray-700 dark:text-white"
            />
            <Input
              id="password"
              name="password"
              label="Password"
              placeholder="Enter password"
              type="password"
              error={state?.error?.password}
              className="w-full dark:bg-gray-700 dark:text-white"
            />
            <Input
              id="delete"
              name="delete"
              label='Type "DELETE" to confirm'
              placeholder="Type DELETE"
              type="text"
              error={state?.error?.delete}
              className="w-full dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <SubmitBtn
                variant="destructive"
                formId="delete-account-form"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                customTitle={{
                  default: 'Delete Account',
                  onSubmitting: 'Deleting...',
                }}
              />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}