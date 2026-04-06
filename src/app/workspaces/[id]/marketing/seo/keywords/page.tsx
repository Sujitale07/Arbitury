'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, 
  flexRender, type ColumnDef, type SortingState 
} from '@tanstack/react-table';
import { 
  Search, Plus, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, 
  BarChart3, Target, MousePointer2, AlertCircle, Info, ChevronRight, RefreshCw
} from 'lucide-react';
import { Badge, Skeleton, EmptyState, Spinner } from '@/components/ui/Badge';
import { useSeoStore } from '@/stores/seo';
import { useSeoProjects, useSeoKeywords, useAnalyzeSeo, useSeoBusinessInfo, useReAnalyzeSeo } from '@/hooks/useQueries';
import { useNotificationStore } from '@/stores';
import { cn } from '@/lib/utils';

const INTENT_COLOR: Record<string, any> = {
  informational: 'blue',
  commercial: 'yellow',
  transactional: 'green',
  navigational: 'gray',
};

export default function KeywordsPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { activeProjectId, setActiveProject } = useSeoStore();
  const { data: projects = [], isLoading: projectsLoading } = useSeoProjects(workspaceId);
  const { data: keywords = [], isLoading: kwLoading } = useSeoKeywords(workspaceId, activeProjectId);
  const { mutateAsync: analyze, isPending: analyzing } = useAnalyzeSeo(workspaceId);
  const { mutateAsync: reAnalyze, isPending: reAnalyzing } = useReAnalyzeSeo(workspaceId);
  const { data: bizInfo } = useSeoBusinessInfo(workspaceId);
  const pushNotification = useNotificationStore((s) => s.push);

  const [showForm, setShowForm] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!projectsLoading && !hasInitialized) {
      if (projects.length === 0) setShowForm(true);
      setHasInitialized(true);
    }
  }, [projectsLoading, projects.length, hasInitialized]);

  const [form, setForm] = useState({
    projectName: '',
    businessType: '',
    location: '',
    seedKeywords: '',
    competitors: '',
  });

  // Pre-fill form from database
  useEffect(() => {
    if (bizInfo && !form.businessType) {
      setForm(f => ({
        ...f,
        businessType: bizInfo.industry || '',
        location: bizInfo.website || '', // Using website as a fallback for location-like prompt or just leaving it for industry
      }));
    }
  }, [bizInfo]);

  const handleAnalyze = async () => {
    if (!form.businessType.trim()) {
      pushNotification({ type: 'error', title: 'Required', message: 'Business type is required.' });
      return;
    }
    try {
      const result = await analyze({
        projectName: form.projectName || form.businessType,
        businessType: form.businessType,
        location: form.location || undefined,
        seedKeywords: form.seedKeywords ? form.seedKeywords.split(',').map(s => s.trim()).filter(Boolean) : [],
        competitors: form.competitors ? form.competitors.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      if (result.success) {
        setActiveProject(result.data?.projectId ?? null);
        setShowForm(false);
        pushNotification({ type: 'success', title: 'Analysis Complete', message: `Found ${result.data?.keywords?.length ?? 0} keywords.` });
      } else {
        pushNotification({ type: 'error', title: 'Analysis Failed', message: result.error ?? 'Please try again.' });
      }
    } catch (e: any) {
      pushNotification({ type: 'error', title: 'Error', message: e.message });
    }
  };

  const handleReAnalyze = async () => {
    if (!activeProjectId) return;
    try {
      await reAnalyze(activeProjectId);
      pushNotification({ type: 'success', title: 'SEO Refreshed', message: 'Keyword data updated using fresh AI analysis.' });
    } catch (e: any) {
      pushNotification({ type: 'error', title: 'Update Failed', message: e.message });
    }
  };

  // ─── Table state ─────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([{ id: 'opportunityScore', desc: true }]);
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');

  const filtered = useMemo(() => {
    let rows = keywords as any[];
    if (intentFilter !== 'all') rows = rows.filter(k => k.intent === intentFilter);
    if (diffFilter === 'easy') rows = rows.filter(k => k.difficulty < 35);
    else if (diffFilter === 'medium') rows = rows.filter(k => k.difficulty >= 35 && k.difficulty < 65);
    else if (diffFilter === 'hard') rows = rows.filter(k => k.difficulty >= 65);
    if (globalFilter) rows = rows.filter(k => k.keyword.toLowerCase().includes(globalFilter.toLowerCase()));
    return rows;
  }, [keywords, intentFilter, diffFilter, globalFilter]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.original.keyword}</span>
        </div>
      ),
    },
    {
      accessorKey: 'searchVolume',
      header: 'Volume',
      cell: ({ getValue }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{(getValue() as number).toLocaleString()}</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Searches/mo</span>
        </div>
      ),
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ getValue }) => <DifficultyBar value={getValue() as number} />,
    },
    {
      accessorKey: 'intent',
      header: 'Intent',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={INTENT_COLOR[v] ?? 'gray'}>{v}</Badge>;
      },
    },
    {
      accessorKey: 'opportunityScore',
      header: 'Opportunity',
      cell: ({ getValue }) => <OpportunityScore score={getValue() as number} />,
    },
    {
      accessorKey: 'currentRank',
      header: 'Rank',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {v ? (
              <Badge variant="blue">#{v}</Badge>
            ) : (
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Not ranking</span>
            )}
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const SortIcon = ({ col }: { col: any }) => {
    const sorted = col.getIsSorted();
    if (!sorted) return <ArrowUpDown size={11} style={{ opacity: 0.4 }} />;
    return sorted === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  if (!activeProjectId && !projectsLoading && !showForm) {
    return (
      <div className="page-body">
        <EmptyState 
          message="No active SEO project" 
          icon={<Sparkles size={32} />} 
        />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Start First Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Search & Actions Bar */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        marginBottom: 20, gap: 16, flexWrap: 'wrap' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div className="search-wrap" style={{ maxWidth: 320, flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input 
              className="search-input" 
              placeholder="Search discovered keywords..." 
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <div style={{ height: 20, width: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={12} style={{ color: 'var(--text-3)' }} />
            <select 
              className="select-minimal"
              value={intentFilter}
              onChange={e => setIntentFilter(e.target.value)}
            >
              <option value="all">All Intents</option>
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
            </select>
            <select 
              className="select-minimal"
              value={diffFilter}
              onChange={e => setDiffFilter(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy (&lt;35)</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard (65+)</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={handleReAnalyze} 
            disabled={reAnalyzing}
            style={{ gap: 8 }}
          >
            <RefreshCw size={14} className={reAnalyzing ? 'animate-spin' : ''} />
            {reAnalyzing ? 'Refreshing...' : 'Re-analyze'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ gap: 8 }}>
            <Plus size={14} /> New Research Project
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="seo-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon col={header.column} />
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {kwLoading || analyzing ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><Skeleton height={14} width={j === 0 ? '70%' : '40%'} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState 
                      message={keywords.length > 0 ? "No keywords match your filters." : "No keywords found. Run an analysis to start."} 
                      icon={<BarChart3 size={24} />} 
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Project Modal (Overlay) */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">New Keyword Research</h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  AI will analyze your niche and find high-opportunity keywords.
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Business Type <span style={{ color: 'var(--red)' }}>*</span></label>
                <input 
                  className="form-input" 
                  placeholder="e.g. Dental Clinic, E-commerce Store"
                  value={form.businessType}
                  onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                />
                <span className="form-hint">Used by AI to understand your industry and specific terminology.</span>
              </div>
              
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. Summer 2025 Campaign"
                    value={form.projectName}
                    onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location (optional)</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. New York, USA"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seed Keywords</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Comma-separated themes you want to focus on..."
                  value={form.seedKeywords}
                  onChange={e => setForm(f => ({ ...f, seedKeywords: e.target.value }))}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Competitor Domains</label>
                <input 
                  className="form-input" 
                  placeholder="domain1.com, domain2.com"
                  value={form.competitors}
                  onChange={e => setForm(f => ({ ...f, competitors: e.target.value }))}
                />
              </div>

              <div className="ai-notice">
                <Info size={14} />
                <span>AI analysis typically takes 5-10 seconds to generate deep insights.</span>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{ gap: 8, minWidth: 160 }}
              >
                {analyzing ? (
                  <><Spinner size={14} /> Processing...</>
                ) : (
                  <><Sparkles size={14} /> Run AI Analysis</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 200ms ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .modal-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          width: 95%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        .modal-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
        .modal-title { font-size: 16, font-weight: 600; margin: 0; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--surface-2); display: flex; justify-content: flex-end; gap: 12; }
        
        .form-hint { font-size: 11px, color: var(--text-3); margin-top: 4px; display: block; }
        .ai-notice {
          background: var(--primary-dim);
          border: 1px solid var(--border);
          padding: 10px 12px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-2);
        }
        
        .select-minimal {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 4px 8px;
          font-size: 12px;
          color: var(--text-2);
          outline: none;
        }
        
        .seo-table th { background: var(--surface-2); padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
        .seo-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-2); }
        .seo-table tr:hover td { background: var(--surface-2); }
      `}</style>
    </div>
  );
}

function DifficultyBar({ value }: { value: number }) {
  const color = value < 35 ? 'var(--green)' : value < 65 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ width: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}>
        <span style={{ color }}>{value < 35 ? 'Easy' : value < 65 ? 'Medium' : 'Hard'}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 4, width: '100%', background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 600ms' }} />
      </div>
    </div>
  );
}

function OpportunityScore({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ 
        width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="16" cy="16" r="14" fill="none" stroke="var(--primary)" strokeWidth="2"
            strokeDasharray={`${(score / 100) * 88} 88`} strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ display: 'none' }}>
        {score >= 80 && <Badge variant="green">High</Badge>}
      </div>
    </div>
  );
}
