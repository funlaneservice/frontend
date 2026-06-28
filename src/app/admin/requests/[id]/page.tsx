import { AdminRequestDetailContainer } from '@/containers/admin/AdminRequestDetailContainer';

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminRequestDetailContainer id={id} />;
}
