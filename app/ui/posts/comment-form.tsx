'use client';
import { useActionState } from 'react';
import { addComment } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import type { AddCommentState } from '@/app/lib/actions';
export default function CommentForm({
    postSlug,
    parentId = null,
    onSuccess,
}: {
    postSlug: string;
    parentId?: string | null;
    onSuccess?: () => void;
}) {
    const [state, formAction, isPending] = useActionState<AddCommentState, FormData>(
        async (prevState: AddCommentState, formData: FormData) => {
            const result = await addComment(postSlug, prevState, formData);
            if (result?.success && onSuccess) {
                onSuccess();
            }
            return result;
        },
        null
    );
    return (
        <form action={formAction} className="mt-4">
            <input type="hidden" name="parentId" value={parentId || ''} />
            <textarea
                name="content"
                rows={3}
                placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
            {state?.error && (
                <p className="text-sm text-red-500 mt-1">{state.error}</p>
            )}
            <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Posting...' : parentId ? 'Reply' : 'Post Comment'}
                </Button>
            </div>
        </form>
    );
}