'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

const AUTH_PREFIXES = ['/sign-in', '/sign-up'];
const MINIMAL_CHROME_PREFIXES = ['/invite', '/workspaces'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  const minimalChrome = 
    MINIMAL_CHROME_PREFIXES.some((p) => p === '/invite' ? pathname.startsWith(p) : pathname === p || pathname === `${p}/`);

  if (minimalChrome) {
    return (
      <div
        className="auth-shell"
        style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}
      >
        {children}
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="auth-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
