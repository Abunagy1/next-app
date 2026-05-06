'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { togglePostReaction } from '@/app/lib/actions';
export default function PostReactions({ postSlug }: { postSlug: string }) {
    const { data: session } = useSession();
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetch(`/api/post-reactions?slug=${postSlug}`)
            .then(res => res.json())
            .then(data => {
                setLikes(data.likes);
                setDislikes(data.dislikes);
                setUserReaction(data.userReaction);
            })
            .catch(console.error);
    }, [postSlug]);
    const handleReaction = async (type: 'like' | 'dislike') => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await togglePostReaction(postSlug, type);
            if (result.success) {
                // Optimistic update
                const newUserReaction = userReaction === type ? null : type;
                setUserReaction(newUserReaction);
                if (type === 'like') {
                    setLikes(prev => userReaction === 'like' ? prev - 1 : prev + 1);
                    if (userReaction === 'dislike') setDislikes(prev => prev - 1);
                } else {
                    setDislikes(prev => userReaction === 'dislike' ? prev - 1 : prev + 1);
                    if (userReaction === 'like') setLikes(prev => prev - 1);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex items-center gap-4 my-4">
            <button
                onClick={() => handleReaction('like')}
                disabled={loading || !session}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                    userReaction === 'like'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
            >
                <ThumbsUpIcon className="w-4 h-4" />
                <span>{likes}</span>
            </button>
            <button
                onClick={() => handleReaction('dislike')}
                disabled={loading || !session}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                    userReaction === 'dislike'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
            >
                <ThumbsDownIcon className="w-4 h-4" />
                <span>{dislikes}</span>
            </button>
            {!session && (
                <p className="text-xs text-gray-500">Log in to react</p>
            )}
        </div>
    );
}