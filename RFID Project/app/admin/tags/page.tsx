import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRoleFromGroups, IT_ADMIN } from '@/lib/auth/roles';
import TagsClient from './TagsClient';

export default async function TagManagementPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  if (role !== IT_ADMIN) redirect('/dashboard');

  return <TagsClient />;
}
