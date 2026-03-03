import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import EditPostForm from '@/app/ui/posts/edit-form';
import { fetchPostBySlug } from '@/app/lib/data';
import { notFound } from 'next/navigation';
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const post = await fetchPostBySlug(id);
  if (!post) {
    notFound();
  }
  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Posts', href: '/dashboard/posts' },
          {
            label: 'Edit Post',
            href: `/dashboard/posts/${id}`,
            active: true,
          },
        ]}
      />
      <div className="mt-6">
        <EditPostForm post={post} />
      </div>
    </div>
  );
}