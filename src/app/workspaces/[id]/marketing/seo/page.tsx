import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function SeoIndexPage({ params }: Props) {
  const { id } = await params;
  redirect(`/workspaces/${id}/marketing/seo/keywords`);
}
