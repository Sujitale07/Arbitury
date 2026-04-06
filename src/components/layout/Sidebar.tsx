'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  Sparkles,
  BarChart2,
  Settings,
  Store,
  Search,
  Globe,
  Lightbulb,
  TrendingUp,
  Zap,
  ChevronDown,
  Mail,
  Briefcase,
  UsersRound,
} from 'lucide-react';
import { UserButton, SignInButton, useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

function workspaceBase(pathname: string): string | null {
  const m = pathname.match(/^\/workspaces\/([^/]+)/);
  return m ? `/workspaces/${m[1]}` : null;
}

export function Sidebar() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const base = workspaceBase(pathname);
  const seoPrefix = base ? `${base}/marketing/seo` : '';

  const SEO_NAV = useMemo(
    () =>
      base
        ? [
            { href: `${seoPrefix}/keywords`, icon: Search, label: 'Keyword Research' },
            { href: `${seoPrefix}/competitors`, icon: Globe, label: 'Competitor Analysis' },
            { href: `${seoPrefix}/content`, icon: Lightbulb, label: 'Content Ideas' },
            { href: `${seoPrefix}/rankings`, icon: TrendingUp, label: 'Rank Tracking' },
            { href: `${seoPrefix}/actions`, icon: Zap, label: 'SEO Actions' },
          ]
        : [],
    [base, seoPrefix],
  );

  const NAV = useMemo(() => {
    if (!base) {
      return [
        {
          label: 'Main',
          items: [{ href: '/workspaces', icon: Briefcase, label: 'Workspaces' }],
        },
      ];
    }
    return [
      {
        label: 'Main',
        items: [
          { href: base, icon: LayoutDashboard, label: 'Dashboard' },
          { href: `${base}/inventory`, icon: Package, label: 'Inventory' },
          { href: `${base}/orders`, icon: ShoppingCart, label: 'Orders' },
        ],
      },
      {
        label: 'Growth',
        items: [
          { href: `${base}/customers`, icon: Users, label: 'Customers' },
          {
            label: 'Marketing',
            icon: Megaphone,
            isGroup: true,
            children: [
              { label: 'Email Campaigns', href: `${base}/marketing`, icon: Mail },
              { label: 'SEO Marketing', isSeoGroup: true, icon: Search },
            ],
          },
          { href: `${base}/ai`, icon: Sparkles, label: 'AI Insights' },
        ],
      },
      {
        label: 'More',
        items: [
          { href: `${base}/store`, icon: Store, label: 'Store' },
          { href: `${base}/reports`, icon: BarChart2, label: 'Reports' },
          { href: `${base}/settings`, icon: Settings, label: 'Settings' },
          { href: `${base}/teams`, icon: UsersRound, label: 'Teams' },
          { href: '/workspaces', icon: Briefcase, label: 'Workspaces' },
        ],
      },
    ];
  }, [base]);

  const isMarketingActive = !!(base && pathname.startsWith(`${base}/marketing`));
  const isSeoActive = !!(base && pathname.startsWith(`${base}/marketing/seo`));

  const [marketingExpanded, setMarketingExpanded] = useState(isMarketingActive);
  const [seoExpanded, setSeoExpanded] = useState(isSeoActive);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-dot" />
        Arbitury Pro
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-label">{section.label}</div>
            <div className="sidebar-nav">
              {section.items.map((item: any) => {
                if (item.isGroup) {
                  const Icon = item.icon;
                  const isAnyChildActive = item.children.some((c: any) =>
                    c.href ? pathname === c.href || pathname.startsWith(`${c.href}/`) : isSeoActive,
                  );

                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setMarketingExpanded(!marketingExpanded)}
                        className={cn('nav-link w-full', isAnyChildActive && 'active')}
                        style={{ justifyContent: 'space-between', textAlign: 'left', width: '100%' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={15} />
                          {item.label}
                        </span>
                        <ChevronDown
                          size={12}
                          style={{
                            transform: marketingExpanded ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 180ms',
                            opacity: 0.6,
                          }}
                        />
                      </button>

                      {marketingExpanded && (
                        <div
                          style={{
                            marginLeft: 12,
                            borderLeft: '1px solid var(--border)',
                            paddingLeft: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            marginTop: 6,
                          }}
                        >
                          {item.children.map((child: any) => {
                            if (child.isSeoGroup) {
                              return (
                                <div key="seo-group">
                                  <button
                                    onClick={() => setSeoExpanded(!seoExpanded)}
                                    className={cn('nav-link w-full', isSeoActive && 'active')}
                                    style={{ justifyContent: 'space-between', textAlign: 'left', width: '100%', fontSize: 13 }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <child.icon size={14} />
                                      {child.label}
                                    </span>
                                    <ChevronDown
                                      size={11}
                                      style={{
                                        transform: seoExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 180ms',
                                        opacity: 0.6,
                                      }}
                                    />
                                  </button>

                                  {seoExpanded && (
                                    <div
                                      style={{
                                        paddingLeft: 12,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        marginTop: 6,
                                      }}
                                    >
                                      {SEO_NAV.map((sub) => (
                                        <Link
                                          key={sub.href}
                                          href={sub.href}
                                          className={cn('nav-link', pathname.startsWith(sub.href) && 'active')}
                                          style={{ fontSize: 12, padding: '5px 8px' }}
                                        >
                                          <sub.icon size={12} />
                                          {sub.label}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'nav-link',
                                  (pathname === child.href || pathname.startsWith(`${child.href}/`)) && 'active',
                                )}
                                style={{ fontSize: 13 }}
                              >
                                <child.icon size={14} />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active =
                  item.href === '/workspaces'
                    ? pathname === '/workspaces'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link key={item.href} href={item.href} className={cn('nav-link', active && 'active')}>
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ alignItems: 'center', gap: 12 }}>
        {!isLoaded ? (
          <div style={{ width: 36, height: 36 }} aria-hidden />
        ) : isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button type="button" className="btn btn-secondary btn-sm">
              Sign in
            </button>
          </SignInButton>
        )}
      </div>
    </aside>
  );
}
