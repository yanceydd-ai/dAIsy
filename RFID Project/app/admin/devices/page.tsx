import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRoleFromGroups, IT_ADMIN } from '@/lib/auth/roles';
import DevicesClient from './DevicesClient';

export default async function DeviceHealthPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  if (role !== IT_ADMIN) redirect('/dashboard');

  return <DevicesClient />;
}
