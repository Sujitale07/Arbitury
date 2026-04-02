'use client';

import { useState } from 'react';
import { Globe, Plus, X, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { useSeoStore } from '@/stores/seo';
import { useSeoCompetitors, useSeoProjects } from '@/hooks/useQueries';

function DomainAuthority({ value }: { value: number }) {
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-3)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(value / 100) * 94.2} 94.2`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 9, fontWeight: 700, color,
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  const { activeProjectId } = useSeoStore();
  const { data: projects = [] } = useSeoProjects();
  const { data: competitors = [], isLoading } = useSeoCompetitors(activeProjectId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasProject = projects.length > 0;

  if (!hasProject) {
    return (
      <div className="page-body">
        <div className="card">
          <EmptyState message="Run a keyword analysis first to see competitor insights" icon="🌐" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Stats */}
      <div className="grid-3 mb-5">
        <div className="stat-tile">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Competitors Tracked</span>
            <Globe size={12} className="text-muted" />
          </div>
          <div className="stat-value mt-1">{isLoading ? '—' : competitors.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Avg Domain Authority</div>
          <div className="stat-value mt-1" style={{ color: 'var(--yellow)' }}>
            {isLoading || !competitors.length
              ? '—'
              : Math.round((competitors as any[]).reduce((s: number, c: any) => s + c.domainAuthority, 0) / competitors.length)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Total Est. Traffic</div>
          <div className="stat-value mt-1" style={{ color: 'var(--primary)' }}>
            {isLoading || !competitors.length
              ? '—'
              : ((competitors as any[]).reduce((s: number, c: any) => s + c.estimatedTraffic, 0) / 1000).toFixed(0) + 'K'}
          </div>
        </div>
      </div>

      {/* Competitors table */}
      <div className="card mb-5" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '14px 16px' }}>
          <span className="card-title">Competitor Overview</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Domain Authority</th>
                <th>Est. Monthly Traffic</th>
                <th>Top Keywords</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}><Skeleton height={14} /></td>
                    ))}
                  </tr>
                ))
              ) : !competitors.length ? (
                <tr key={1}>
                  <td colSpan={5}>
                    <EmptyState message="No competitors in this project" icon="🔭" />
                  </td>
                </tr>
              ) : (
                (competitors as any[]).map((c) => (
                  <>
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                          }}>
                            {c.domain.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{c.domain}</div>
                            <a href={`https://${c.domain}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'underline' }}
                              onClick={e => e.stopPropagation()}>
                              Visit site
                            </a>
                          </div>
                        </div>
                      </td>
                      <td><DomainAuthority value={c.domainAuthority} /></td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {c.estimatedTraffic >= 1000
                            ? `${(c.estimatedTraffic / 1000).toFixed(1)}K`
                            : c.estimatedTraffic}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>/mo</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(c.topKeywords as string[]).slice(0, 3).map((kw: string, i: number) => (
                            <Badge key={i} variant="gray">{kw}</Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <ChevronRight
                          size={14}
                          style={{
                            color: 'var(--text-3)',
                            transform: expandedId === c.id ? 'rotate(90deg)' : 'rotate(0)',
                            transition: 'transform 180ms',
                          }}
                        />
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === c.id && (
                      <tr key={`${c.id}-expanded`}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{
                            padding: '16px', background: 'var(--surface-2)',
                            borderBottom: '1px solid var(--border)',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                          }}>
                            {/* Strategy */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Strategy Summary
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <TrendingUp size={14} style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                                  {c.strategy || 'No strategy data available.'}
                                </p>
                              </div>
                            </div>

                            {/* Weaknesses */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Weaknesses to Exploit
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(c.weaknesses as string[]).map((w: string, i: number) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <AlertTriangle size={13} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
                                    <span style={{ fontSize: 12.5, color: 'var(--text)' }}>{w}</span>
                                  </div>
                                ))}
                                {!c.weaknesses?.length && (
                                  <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No weakness data</div>
                                )}
                              </div>
                            </div>

                            {/* Top keywords full list */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                All Top Keywords
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {(c.topKeywords as string[]).map((kw: string, i: number) => (
                                  <Badge key={i} variant="blue">{kw}</Badge>
                                ))}
                              </div>
                            </div>

                            {/* Opportunity */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Your Opportunity
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 12.5, color: 'var(--text)' }}>
                                  Target their weaknesses and low-competition keywords they rank for to capture their traffic.
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
