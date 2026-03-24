import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRoleFromGroups, COMPLIANCE_OFFICER } from '@/lib/auth/roles';
import RetentionClient from './RetentionClient';

export default async function RetentionPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  if (role !== COMPLIANCE_OFFICER) redirect('/dashboard');

  return <RetentionClient />;
}
