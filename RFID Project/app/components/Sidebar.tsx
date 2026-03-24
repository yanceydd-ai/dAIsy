'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  userName: string | null | undefined;
  userRole: string | null | undefined;
  isITAdmin: boolean;
  isComplianceOfficer: boolean;
}

export default function Sidebar({ userName, userRole, isITAdmin, isComplianceOfficer }: SidebarProps) {
  const pathname = usePathname();

  const navItem = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'bg-white/20 text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full w-60 flex flex-col z-10"
      style={{ backgroundColor: '#004023' }}
    >
      {/* Logo / wordmark */}
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-white font-semibold text-sm tracking-wide leading-tight">
          The Hockaday School
        </p>
        <p className="text-white/70 text-xs mt-0.5">Presence System</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItem('/', 'Dashboard')}
        {navItem('/sessions', 'Sessions')}

        {isITAdmin && (
          <>
            <div className="my-2 border-t border-white/10" />
            {navItem('/admin/tags', 'Tag Management')}
            {navItem('/admin/devices', 'Device Health')}
            {navItem('/admin/sync', 'Sync Status')}
          </>
        )}

        {isComplianceOfficer && (
          <>
            <div className="my-2 border-t border-white/10" />
            {navItem('/admin/audit', 'Audit Log')}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white text-sm font-medium truncate">{userName ?? 'Staff'}</p>
        {userRole && (
          <p className="text-white/60 text-xs mt-0.5 truncate">{userRole}</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3 text-white/70 hover:text-white text-xs underline underline-offset-2 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
