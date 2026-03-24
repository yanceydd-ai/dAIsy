import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  // Already authenticated — send to dashboard
  if (session) {
    redirect('/');
  }

  const isUnauthorized = params.error === 'unauthorized';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="px-8 py-6"
        style={{ backgroundColor: '#004023' }}
      >
        <h1 className="text-white text-xl font-semibold tracking-wide">
          The Hockaday School — Presence System
        </h1>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center bg-[#F4F6F5]">
        <div className="bg-white rounded-lg shadow-sm border border-[#D0D9D8] p-10 w-full max-w-sm flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-[#3E3E3F] text-2xl font-semibold mb-2">Sign in</h2>
            <p className="text-[#6B7280] text-sm">
              Use your Hockaday account to continue.
            </p>
          </div>

          {isUnauthorized && (
            <div
              role="alert"
              className="w-full rounded border-l-4 border-[#BF202A] bg-[#FDF2F2] px-4 py-3 text-sm text-[#BF202A]"
            >
              Your account does not have access to this system. Contact your IT administrator.
            </div>
          )}

          <form
            action={async () => {
              'use server';
              await signIn('microsoft-entra-id', { redirectTo: '/' });
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="w-full rounded-md px-5 py-2.5 text-white font-medium text-sm
                         transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                         focus:ring-[#519B57] disabled:opacity-45 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#004023' }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013440';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#004023';
              }}
            >
              Sign in with Hockaday Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
