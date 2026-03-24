import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/auth';
import SessionProvider from '@/app/components/SessionProvider';
import AppShell from '@/app/components/AppShell';
import { ensureIoTConsumerStarted } from '@/lib/presence/init';
import { startBlackbaudScheduler } from '@/lib/integrations/blackbaudScheduler';
import { startRetentionScheduler } from '@/lib/audit/retentionScheduler';

export const metadata: Metadata = {
  title: 'Hockaday Presence System',
  description: 'RFID-based student presence tracking',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  ensureIoTConsumerStarted();
  startBlackbaudScheduler();
  startRetentionScheduler();
  const session = await auth();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <SessionProvider session={session}>
          <AppShell session={session}>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
