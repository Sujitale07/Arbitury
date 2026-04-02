'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Minus, RefreshCw, BarChart2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell 
} from 'recharts';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { useSeoStore } from '@/stores/seo';
import { useSeoRankings, useSeoProjects } from '@/hooks/useQueries';
import { formatDate, cn } from '@/lib/utils';

// Colour palette for bars
const COLORS = ['var(--primary)', 'var(--green)', 'var(--yellow)', 'var(--accent)', '#a78bfa', '#38bdf8'];

// Custom Recharts tooltip (Inverted logic for Rank)
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => {
        const actualRank = 100 - p.value;
        return (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
            <strong style={{ color: 'var(--text)' }}>#{actualRank}</strong>
          </div>
        );
      })}
    </div>
  );
}

// Alert card for big drops
function RankingAlert({ keyword, previousPos, currentPos }: { keyword: string; previousPos: number; currentPos: number }) {
  const drop = currentPos - previousPos;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.2)',
      borderRadius: 'var(--radius)', marginBottom: 8,
    }}>
      <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{keyword}</span>
        <span style={{ color: 'var(--text-2)', fontSize: 12 }}>
          {' '}dropped from <strong>#{previousPos}</strong> to <strong>#{currentPos}</strong>
        </span>
      </div>
      <Badge variant="red">−{drop} positions</Badge>
    </div>
  );
}

export default function RankingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { activeProjectId } = useSeoStore();
  const { data: projects = [] } = useSeoProjects();
  const { data: rankingData = [], isLoading, refetch, isFetching } = useSeoRankings(activeProjectId);

  // Build chart data: merge ranking snapshots into Score-based format (100 - Position)
  const chartData = (() => {
    if (!rankingData.length) return [];
    const dateMap: Record<string, Record<string, number>> = {};

    (rankingData as any[]).forEach(kw => {
      (kw.rankings as any[]).forEach(r => {
        const date = formatDate(r.recordedAt, 'MMM d');
        if (!dateMap[date]) dateMap[date] = {};
        // Convert to Score (100 is best, 0 is worst)
        dateMap[date][kw.keyword] = Math.max(0, 100 - r.position);
      });
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, kws]) => ({ date, ...kws }));
  })();

  // Detect alerts (drop > 5 in latest snapshot vs previous)
  const alerts = (rankingData as any[]).flatMap(kw => {
    const rankings = kw.rankings as any[];
    if (rankings.length < 2) return [];
    const latest = rankings[rankings.length - 1];
    const previous = rankings[rankings.length - 2];
    if (!latest || !previous) return [];
    const drop = latest.position - previous.position;
    if (drop > 5) {
      return [{ keyword: kw.keyword, previousPos: previous.position, currentPos: latest.position }];
    }
    return [];
  });

  if (!projects.length) {
    return (
      <div className="page-body">
        <div className="card"><EmptyState message="Run a keyword analysis first to track rankings" icon="📈" /></div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card mb-5" style={{ borderColor: 'rgba(248,81,73,.3)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> Ranking Alerts
            </span>
            <Badge variant="red">{alerts.length} drops detected</Badge>
          </div>
          {alerts.map((a, i) => (
            <RankingAlert key={i} {...a} />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid-3 mb-5">
        <div className="stat-tile">
          <div className="stat-label">Keywords Tracked</div>
          <div className="stat-value mt-1">{rankingData.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Avg Rank</div>
          <div className="stat-value mt-1" style={{ color: 'var(--primary)' }}>
            {!rankingData.length ? '—' : (() => {
              const withRank = (rankingData as any[]).filter(k => k.currentRank);
              if (!withRank.length) return '—';
              return `#${Math.round(withRank.reduce((s: number, k: any) => s + k.currentRank, 0) / withRank.length)}`;
            })()}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Top 10 Rankings</div>
          <div className="stat-value mt-1" style={{ color: 'var(--green)' }}>
            {(rankingData as any[]).filter(k => k.currentRank && k.currentRank <= 10).length}
          </div>
        </div>
      </div>

      {/* Bar chart of Ranking History */}
      <div className="card mb-5">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} style={{ color: 'var(--primary)' }} />
            <span className="card-title">Ranking Performance</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <RefreshCw size={12} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            {isFetching ? 'Refreshing…' : 'Sync Latest'}
          </button>
        </div>

        {!mounted || isLoading ? (
          <Skeleton height={280} />
        ) : !chartData.length ? (
          <EmptyState message="No ranking history discovered yet." icon="📊" />
        ) : (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
              Note: Taller bars represent better rankings (Score = 100 - Position).
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                {(rankingData as any[]).slice(0, 5).map((kw: any, i: number) => (
                  <Bar
                    key={kw.id}
                    dataKey={kw.keyword}
                    name={kw.keyword}
                    fill={COLORS[i % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Rankings table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '14px 16px' }}>
          <span className="card-title">Real-Time Position Monitoring</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Current Status</th>
                <th>History</th>
                <th>Movement</th>
                <th>Source URL</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => <td key={j}><Skeleton height={13} /></td>)}
                  </tr>
                ))
              ) : !(rankingData as any[]).length ? (
                <tr><td colSpan={5}><EmptyState message="Connect your domain to start tracking" icon={<TrendingUp size={24} />} /></td></tr>
              ) : (
                (rankingData as any[]).map((kw: any) => {
                  const rankings = kw.rankings as any[];
                  const current = rankings[rankings.length - 1];
                  const previous = rankings[rankings.length - 2];
                  const currentPos = current?.position;
                  const previousPos = previous?.position;
                  const change = currentPos && previousPos ? previousPos - currentPos : null;

                  return (
                    <tr key={kw.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{kw.keyword}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Tracking since {formatDate(kw.createdAt, 'MMM yyyy')}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: currentPos && currentPos <= 10 ? 'var(--green)' : 'var(--text)' }}>
                            {currentPos ? `#${currentPos}` : 'Unranked'}
                          </span>
                          {currentPos && currentPos <= 3 && <Badge variant="yellow">Top 3</Badge>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
                          {rankings.slice(-10).map((r, i) => {
                            const h = Math.max(4, Math.round((100 - r.position) / 10 * 2));
                            return (
                              <div 
                                key={i} 
                                style={{ 
                                  width: 4, 
                                  height: `${h}px`, 
                                  background: r.position <= 10 ? 'var(--green)' : 'var(--primary)',
                                  opacity: 0.5 + (i / 10) * 0.5,
                                  borderRadius: 1
                                }}
                                title={`Rank: #${r.position} on ${formatDate(r.recordedAt)}`}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        {change !== null && change !== 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: change > 0 ? 'var(--green)' : 'var(--red)' }}>
                            {change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span style={{ fontWeight: 600 }}>{Math.abs(change)}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)' }}>
                            <Minus size={14} />
                            <span>No change</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {current?.url ? (
                          <a 
                            href={current.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="link-btn"
                            style={{ 
                              fontSize: 12, 
                              color: 'var(--primary)', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            View Page
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
