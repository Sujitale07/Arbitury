'use client';

import { useThemeStore, type AppTheme } from '@/stores/theme';
import { Palette, ChevronDown, Check, Building2, LayoutPanelLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWorkspaces } from '@/hooks/useQueries';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const wsDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: workspaces = [] } = useWorkspaces();
  const params = useParams();
  const router = useRouter();
  const currentId = params?.id as string;
  const currentWs = workspaces.find(w => w.id === currentId);
  
  const themes: Array<{ id: AppTheme; label: string; primary: string }> = [
    { id: 'boutique', label: 'Boutique (Wellness)', primary: '#5b6a4a' },
    { id: 'void', label: 'Void Space (Tech)', primary: '#58a6ff' },
    { id: 'forest', label: 'Forest (Archival)', primary: '#c5a059' },
    { id: 'rose', label: 'Rose Quartz (Playful)', primary: '#d48a8a' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(event.target as Node)) {
        setIsWsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Workspace Switcher */}
        <div className="relative" ref={wsDropdownRef}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsWsOpen(!isWsOpen)}
            style={{ minWidth: 180, justifyContent: 'space-between', padding: '6px 10px', borderRadius: 10 }}
          >
            <div className="flex items-center gap-2">
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={13} />
              </div>
              <span style={{ fontWeight: 600 }}>{currentWs?.name || 'Select Workspace'}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform ${isWsOpen ? 'rotate-180' : ''}`} style={{ opacity: 0.5 }} />
          </button>

          {isWsOpen && (
            <div className="card" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 240,
              padding: 8,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ padding: '4px 8px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em' }}>SWITCH WORKSPACE</div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    router.push(`/workspaces/${ws.id}`);
                    setIsWsOpen(false);
                  }}
                  className={`btn btn-ghost btn-sm w-full`}
                  style={{ 
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: currentId === ws.id ? 'var(--primary-dim)' : 'transparent',
                    color: currentId === ws.id ? 'var(--primary)' : 'var(--text)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={14} style={{ opacity: 0.6 }} />
                    <span style={{ fontWeight: currentId === ws.id ? 600 : 400 }}>{ws.name}</span>
                  </div>
                  {currentId === ws.id && <Check size={14} />}
                </button>
              ))}
              <div className="divider" style={{ margin: '4px 0' }} />
              <Link
                href="/workspaces"
                className="btn btn-ghost btn-sm w-full"
                style={{ justifyContent: 'flex-start', gap: 8 }}
                onClick={() => setIsWsOpen(false)}
              >
                <LayoutPanelLeft size={14} style={{ opacity: 0.6 }} />
                <span>View all Workspaces</span>
              </Link>
            </div>
          )}
        </div>

        <div className="divider-v" style={{ height: 20, width: 1, background: 'var(--border)' }} />
        <span className="page-title" style={{ fontSize: 14 }}>{title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {children}
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOpen(!isOpen)}
            style={{ padding: '6px 12px', gap: 6 }}
          >
            <Palette size={14} style={{ opacity: 0.7 }} />
            <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="card" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 200,
              padding: 8,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: 'var(--shadow-md)',
            }}>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`btn btn-ghost btn-sm w-full`}
                  style={{ 
                    justifyContent: 'space-between',
                    background: theme === t.id ? 'var(--surface-2)' : 'transparent',
                    color: theme === t.id ? 'var(--primary)' : 'var(--text)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, background: t.primary, borderRadius: '50%' }} />
                    <span>{t.label}</span>
                  </div>
                  {theme === t.id && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="divider-v" style={{ height: 20, width: 1, background: 'var(--border)' }} />
        
        <div className="flex items-center gap-2">
          <UserButton />
        </div>
      </div>
    </header>
  );
}

