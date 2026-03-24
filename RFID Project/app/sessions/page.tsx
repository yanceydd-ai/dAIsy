import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionsClient from './SessionsClient';

export default async function SessionsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <SessionsClient />;
}
