import { cookies } from 'next/headers';
import EditPostClient from './EditPostClient';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await cookies();
    return <EditPostClient postId={id} />;
}
