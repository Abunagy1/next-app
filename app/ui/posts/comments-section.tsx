import { getCommentsForPost } from '@/app/lib/data';
import CommentItem from './comment-item';
import CommentForm from './comment-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
export default async function CommentsSection({ postSlug }: { postSlug: string }) {
    const session = await getServerSession(authOptions);
    const comments = await getCommentsForPost(postSlug);
    const isLoggedIn = !!session?.user;
    const countReplies = (comments: any[]): number => {
        let count = 0;
        for (const c of comments) {
            count += 1;
            if (c.replies?.length) count += countReplies(c.replies);
        }
        return count;
    };
    const totalComments = countReplies(comments);
    return (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Comments ({totalComments})
            </h2>
            {isLoggedIn ? (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Add a comment
                    </h3>
                    <CommentForm postSlug={postSlug} />
                </div>
            ) : (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Please <a href="/user/login" className="text-blue-600 hover:underline">log in</a> to comment.
                </p>
            )}
            <div>
                {comments.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} postSlug={postSlug} />
                    ))
                )}
            </div>
        </div>
    );
}