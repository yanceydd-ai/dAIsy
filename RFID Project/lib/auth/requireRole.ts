import { auth } from '@/auth';
import { getRoleFromGroups, type Role } from './roles';

// Server-side role guard. Call at the top of every API route handler.
// Throws a Response with status 403 if the session role does not match.
// Usage:
//   const session = await requireRole(IT_ADMIN);
//   const session = await requireRole([SAFETY_OFFICER, ACTIVITIES_COORDINATOR]);
export async function requireRole(allowed: Role | Role[]): Promise<NonNullable<Awaited<ReturnType<typeof auth>>>> {
  const session = await auth();

  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  const allowedArray = Array.isArray(allowed) ? allowed : [allowed];

  if (!role || !allowedArray.includes(role)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return session;
}

// Require any authenticated role (used for presence endpoints etc.)
export async function requireAuth(): Promise<NonNullable<Awaited<ReturnType<typeof auth>>>> {
  const session = await auth();

  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const role = getRoleFromGroups(session.user.azureAdGroups ?? []);
  if (!role) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return session;
}
