'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import CommentForm from './comment-form';
import CommentReactions from './comment-reactions';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { CommentWithUser } from '@/app/lib/data';
import { deleteComment } from '@/app/lib/actions';
export default function CommentItem({ comment, postSlug, depth = 0 }: {
    comment: CommentWithUser;
    postSlug: string;
    depth?: number;
}) {
    const { data: session } = useSession();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const maxDepth = 3;
    const isLoggedIn = !!session?.user;
    const isOwner = session?.user?.id === comment.user_id;
    const isAdmin = session?.user?.role === 'admin';
    const canDelete = isOwner || isAdmin;
    const handleDelete = async () => {
        // if (!confirm('Are you sure you want to delete this comment and all its replies? This action cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteComment(comment.id);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete comment.');
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div className="mb-4" style={{ marginLeft: depth * 20 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {comment.user.image ? (
                            <Image
                                src={comment.user.image}
                                alt={comment.user.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                                {comment.user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {comment.user.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comment.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            {isLoggedIn && depth < maxDepth && (
                                <button
                                    onClick={() => setShowReplyForm(!showReplyForm)}
                                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Reply
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="text-xs text-red-600 hover:underline dark:text-red-400 flex items-center gap-1"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>
                        <CommentReactions commentId={comment.id} />
                    </div>
                </div>
            </div>
            {showReplyForm && (
                <div className="mt-2 ml-8">
                    <CommentForm
                        postSlug={postSlug}
                        parentId={comment.id}
                        onSuccess={() => setShowReplyForm(false)}
                    />
                </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postSlug={postSlug}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}