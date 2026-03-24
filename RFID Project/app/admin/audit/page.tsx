import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRoleFromGroups, COMPLIANCE_OFFICER } from '@/lib/auth/roles';
import AuditClient from './AuditClient';

export default async function AuditLogPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  if (role !== COMPLIANCE_OFFICER) redirect('/dashboard');

  return <AuditClient />;
}
