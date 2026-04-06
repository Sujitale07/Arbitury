'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Search, Globe, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeoStore } from '@/stores/seo';
import { useSeoProjects, useDeleteSeoProject } from '@/hooks/useQueries';
import { Trash2, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNotificationStore } from '@/stores';

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const pathname = usePathname();
  const base = workspaceId ? `/workspaces/${workspaceId}/marketing/seo` : '';

  const TABS = useMemo(
    () =>
      base
        ? [
            { href: `${base}/keywords`, icon: Search, label: 'Keyword Research' },
            { href: `${base}/competitors`, icon: Globe, label: 'Competitors' },
            { href: `${base}/content`, icon: Lightbulb, label: 'Content Ideas' },
            { href: `${base}/rankings`, icon: TrendingUp, label: 'Rankings' },
            { href: `${base}/actions`, icon: Zap, label: 'SEO Actions' },
          ]
        : [],
    [base],
  );

  const { activeProjectId, setActiveProject } = useSeoStore();
  const { data: projects = [], isLoading: projectsLoading } = useSeoProjects(workspaceId);
  const { mutateAsync: deleteProject } = useDeleteSeoProject(workspaceId);
  const pushNotification = useNotificationStore((s) => s.push);
  const [showProjects, setShowProjects] = useState(false);

  const activeProject = projects.find((p: any) => p.id === activeProjectId) ?? projects[0] ?? null;

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId && !projectsLoading) {
      setActiveProject(projects[0].id);
    }
  }, [projects, activeProjectId, projectsLoading, setActiveProject]);

  useEffect(() => {
    if (!projects.length || !activeProjectId) return;
    if (!projects.some((p: any) => p.id === activeProjectId)) {
      setActiveProject(projects[0]?.id ?? null);
    }
  }, [projects, activeProjectId, setActiveProject]);

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      if (activeProjectId === id) setActiveProject(projects.find((p: any) => p.id !== id)?.id ?? null);
      pushNotification({ type: 'success', title: 'Project Deleted', message: 'SEO project removed.' });
    } catch {
      pushNotification({ type: 'error', title: 'Error', message: 'Failed to delete project.' });
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} style={{ color: 'var(--primary)' }} />
            SEO Marketing
          </span>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowProjects(!showProjects)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160 }}
            >
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                {activeProject ? activeProject.name : 'No project'}
              </span>
              <ChevronDown size={12} />
            </button>
            {showProjects && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowProjects(false)} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 220,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', zIndex: 20, boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                }}>
                  {projects.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>
                      No projects yet. Run an analysis first.
                    </div>
                  ) : (
                    projects.map((p: any) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', cursor: 'pointer',
                          background: p.id === (activeProjectId ?? projects[0]?.id) ? 'var(--primary-dim)' : 'transparent',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={e => { if (p.id !== activeProjectId) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = p.id === activeProjectId ? 'var(--primary-dim)' : 'transparent'; }}
                      >
                        <div onClick={() => { setActiveProject(p.id); setShowProjects(false); }} style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.businessType} · {p._count?.keywords ?? 0} keywords</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                          style={{ marginLeft: 6, color: 'var(--red)', opacity: 0.6 }}
                          title="Delete project"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn('btn btn-ghost btn-sm', pathname.startsWith(href) && 'active')}
              style={{
                gap: 5,
                background: pathname.startsWith(href) ? 'var(--primary-dim)' : 'transparent',
                color: pathname.startsWith(href) ? 'var(--primary)' : 'var(--text-2)',
              }}
            >
              <Icon size={13} />
              <span style={{ fontSize: 12 }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
