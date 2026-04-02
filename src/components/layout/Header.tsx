'use client';

import { useThemeStore, type AppTheme } from '@/stores/theme';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="page-header">
      <span className="page-title">{title}</span>
      
      <div className="flex items-center gap-4">
        {children}
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOpen(!isOpen)}
            style={{ minWidth: 140, justifyContent: 'space-between' }}
          >
            <div className="flex items-center gap-2">
              <Palette size={14} />
              <span>{themes.find(t => t.id === theme)?.label.split(' ')[0]}</span>
            </div>
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
        
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="sidebar-avatar">O</div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Owner</span>
        </div>
      </div>
    </header>
  );
}
