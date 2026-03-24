import type { Session } from 'next-auth';
import Sidebar from './Sidebar';

// Pages that render without the sidebar shell (auth pages)
const SHELL_EXCLUDED_PREFIXES = ['/login'];

interface AppShellProps {
  session: Session | null;
  children: React.ReactNode;
}

export default function AppShell({ session, children }: AppShellProps) {
  // Server component — we can't use usePathname here, so we render the shell
  // conditionally based on whether a session exists. The login page redirects
  // authenticated users, so this is safe.
  if (!session) {
    return <>{children}</>;
  }

  const groups = session.user.azureAdGroups ?? [];
  const itAdminGroup = process.env.AZURE_GROUP_IT_ADMINS ?? '';
  const complianceGroup = process.env.AZURE_GROUP_COMPLIANCE_OFFICERS ?? '';
  const isITAdmin = groups.includes(itAdminGroup);
  const isComplianceOfficer = groups.includes(complianceGroup);

  // Derive a display role label from group membership
  const safetyGroup = process.env.AZURE_GROUP_SAFETY_OFFICERS ?? '';
  const activitiesGroup = process.env.AZURE_GROUP_ACTIVITIES_COORDINATORS ?? '';
  let roleLabel: string | null = null;
  if (groups.includes(itAdminGroup)) roleLabel = 'IT Administrator';
  else if (groups.includes(complianceGroup)) roleLabel = 'Compliance Officer';
  else if (groups.includes(safetyGroup)) roleLabel = 'Safety Officer';
  else if (groups.includes(activitiesGroup)) roleLabel = 'Activities Coordinator';

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={session.user.name}
        userRole={roleLabel}
        isITAdmin={isITAdmin}
        isComplianceOfficer={isComplianceOfficer}
      />
      {/* Main content offset by sidebar width */}
      <main className="flex-1 ml-60 p-8 bg-[#F4F6F5] min-h-screen">
        {children}
      </main>
    </div>
  );
}
