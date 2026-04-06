import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Arbitury Pro — Seeds & Wellness Dashboard',
  description: 'AI-driven business dashboard for seeds and organic wellness: inventory, sales, and predictive marketing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
