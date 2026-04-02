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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const SEO_NAV = [
  { href: '/marketing/seo/keywords', icon: Search, label: 'Keyword Research' },
  { href: '/marketing/seo/competitors', icon: Globe, label: 'Competitor Analysis' },
  { href: '/marketing/seo/content', icon: Lightbulb, label: 'Content Ideas' },
  { href: '/marketing/seo/rankings', icon: TrendingUp, label: 'Rank Tracking' },
  { href: '/marketing/seo/actions', icon: Zap, label: 'SEO Actions' },
];

const NAV = [
  {
    label: 'Main',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/inventory', icon: Package, label: 'Inventory' },
      { href: '/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/customers', icon: Users, label: 'Customers' },
      { 
        label: 'Marketing', 
        icon: Megaphone, 
        isGroup: true,
        children: [
          { label: 'Email Campaigns', href: '/marketing', icon: Mail },
          { label: 'SEO Marketing', isSeoGroup: true, icon: Search },
        ]
      },
      { href: '/ai', icon: Sparkles, label: 'AI Insights' },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/store', icon: Store, label: 'Store' },
      { href: '/reports', icon: BarChart2, label: 'Reports' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isMarketingActive = pathname.startsWith('/marketing');
  const isSeoActive = pathname.startsWith('/marketing/seo');
  
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
                    c.href ? pathname === c.href : pathname.startsWith('/marketing/seo')
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
                        <div style={{ 
                          marginLeft: 12, 
                          borderLeft: '1px solid var(--border)', 
                          paddingLeft: 4, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 4, 
                          marginTop: 6 
                        }}>
                          {item.children.map((child: any) => {
                            if (child.isSeoGroup) {
                              return (
                                <div key="seo-group">
                                  <button
                                    onClick={() => setSeoExpanded(!seoExpanded)}
                                    className={cn('nav-link w-full', pathname.startsWith('/marketing/seo') && 'active')}
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
                                    <div style={{ 
                                      paddingLeft: 12, 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: 2, 
                                      marginTop: 6 
                                    }}>
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
                                className={cn('nav-link', pathname === child.href && 'active')}
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

                const active = item.href === '/' 
                  ? pathname === '/' 
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nav-link', active && 'active')}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">AR</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Arbitury Admin</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@arbitury.com</div>
        </div>
      </div>
    </aside>
  );
}
