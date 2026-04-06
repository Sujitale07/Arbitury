'use client';

import { CheckCircle2, Circle, AlertCircle, TrendingUp, ArrowRight, Printer } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useSeoStore } from '@/stores/seo';
import { useSeoActions, useToggleSeoAction } from '@/hooks/useQueries';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores';

export default function SeoActionsPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { activeProjectId } = useSeoStore();
  const { data: actions = [], isLoading } = useSeoActions(workspaceId, activeProjectId);
  const { mutateAsync: toggleAction } = useToggleSeoAction(workspaceId);
  const pushNotification = useNotificationStore((s) => s.push);

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleAction({ id, completed });
      pushNotification({ 
        type: 'success', 
        title: completed ? 'Action Completed' : 'Action Reopened', 
        message: completed ? 'Nice work! Growth is on the way.' : 'Task moved back to pending.' 
      });
    } catch {
      pushNotification({ type: 'error', title: 'Error', message: 'Failed to update action.' });
    }
  };

  const highPriority = actions.filter((a: any) => a.priority === 'high');
  const mediumPriority = actions.filter((a: any) => a.priority === 'medium');
  const lowPriority = actions.filter((a: any) => a.priority === 'low');

  if (!activeProjectId && !isLoading) {
    return (
      <div className="page-body">
        <EmptyState 
          message="No active SEO project. Go to Keyword Research to run an analysis first." 
          icon="🔍"
        />
      </div>
    );
  }

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>SEO Growth Roadmap</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Prioritized tasks to improve your search visibility and drive more organic traffic.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()} style={{ gap: 6 }}>
          <Printer size={14} /> Export Roadmap
        </button>
      </div>

      <div className="actions-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 24,
        alignItems: 'start'
      }}>
        {/* HIGH PRIORITY */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ 
              width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' 
            }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Impact</h3>
            <div style={{ marginLeft: 'auto' }}>
              <Badge variant="red">{highPriority.length}</Badge>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} />)
            ) : highPriority.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, borderStyle: 'dashed' }}>
                No high priority tasks.
              </div>
            ) : (
              highPriority.map((action: any) => (
                <ActionCard key={action.id} action={action} onToggle={handleToggle} />
              ))
            )}
          </div>
        </section>

        {/* MEDIUM PRIORITY */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ 
              width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)' 
            }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medium Impact</h3>
            <div style={{ marginLeft: 'auto' }}>
              <Badge variant="yellow">{mediumPriority.length}</Badge>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} />)
            ) : mediumPriority.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, borderStyle: 'dashed' }}>
                No medium priority tasks.
              </div>
            ) : (
              mediumPriority.map((action: any) => (
                <ActionCard key={action.id} action={action} onToggle={handleToggle} />
              ))
            )}
          </div>
        </section>

        {/* LOW PRIORITY */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ 
              width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' 
            }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maintenance</h3>
            <div style={{ marginLeft: 'auto' }}>
              <Badge variant="blue">{lowPriority.length}</Badge>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} />)
            ) : lowPriority.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, borderStyle: 'dashed' }}>
                No low priority tasks.
              </div>
            ) : (
              lowPriority.map((action: any) => (
                <ActionCard key={action.id} action={action} onToggle={handleToggle} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .sidebar, .page-header, .btn, .search-wrap { display: none !important; }
          .page-body { padding: 0 !important; margin: 0 !important; }
          .actions-grid { display: block !important; }
          section { margin-bottom: 40px !important; break-inside: avoid; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function ActionCard({ action, onToggle }: { action: any, onToggle: (id: string, completed: boolean) => void }) {
  return (
    <div 
      className={cn("card", action.completed && "opacity-60")} 
      style={{ 
        padding: 16, 
        position: 'relative',
        transition: 'all 200ms ease',
        borderLeft: action.completed ? '3px solid var(--green)' : '3px solid transparent'
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={() => onToggle(action.id, !action.completed)}
          style={{ 
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', height: 'fit-content',
            color: action.completed ? 'var(--green)' : 'var(--text-3)'
          }}
        >
          {action.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h4 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: 'var(--text)',
              textDecoration: action.completed ? 'line-through' : 'none'
            }}>
              {action.action}
            </h4>
          </div>
          
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
            {action.description}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 11, fontWeight: 500 }}>
              <TrendingUp size={12} />
              Est. +{action.trafficGain.toLocaleString()}/mo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', fontSize: 11 }}>
              <AlertCircle size={12} />
              {action.expectedImpact}
            </div>
          </div>
        </div>
      </div>
      
      {!action.completed && (
        <div style={{ 
          position: 'absolute', top: 12, right: 12, 
          opacity: 0, transition: 'opacity 200ms' 
        }} className="hover-show">
          <ArrowRight size={14} style={{ color: 'var(--primary)' }} />
        </div>
      )}
      
      <style jsx>{`
        .card:hover .hover-show { opacity: 1; }
        .opacity-60 { opacity: 0.6; }
      `}</style>
    </div>
  );
}
