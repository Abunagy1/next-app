'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toggleCommentReaction } from '@/app/lib/actions';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👎'];
export default function CommentReactions({ commentId }: { commentId: string }) {
    const { data: session } = useSession();
    const [reactions, setReactions] = useState<Record<string, number>>({});
    const [userEmoji, setUserEmoji] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetch(`/api/comment-reactions?id=${commentId}`)
            .then(res => res.json())
            .then(data => {
                setReactions(data.counts);
                setUserEmoji(data.userEmoji);
            })
            .catch(console.error);
    }, [commentId]);
    const handleReaction = async (emoji: string) => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await toggleCommentReaction(commentId, emoji);
            if (result.success) {
                const oldEmoji = userEmoji;
                setUserEmoji(prev => prev === emoji ? null : emoji);
                setReactions(prev => {
                    const newCounts = { ...prev };
                    if (oldEmoji === emoji) {
                        // removing
                        newCounts[emoji] = (newCounts[emoji] || 1) - 1;
                        if (newCounts[emoji] <= 0) delete newCounts[emoji];
                    } else {
                        // switching or adding
                        if (oldEmoji) {
                            newCounts[oldEmoji] = (newCounts[oldEmoji] || 1) - 1;
                            if (newCounts[oldEmoji] <= 0) delete newCounts[oldEmoji];
                        }
                        newCounts[emoji] = (newCounts[emoji] || 0) + 1;
                    }
                    return newCounts;
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {EMOJIS.map(emoji => {
                const count = reactions[emoji] || 0;
                const isActive = userEmoji === emoji;
                return (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        disabled={loading || !session}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors ${
                            isActive
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <span>{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}