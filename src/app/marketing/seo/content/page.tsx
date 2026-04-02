'use client';

import { Lightbulb, BookOpen, Layout, Network, FileText, ExternalLink, TrendingUp } from 'lucide-react';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { useSeoStore } from '@/stores/seo';
import { useSeoContentIdeas, useSeoProjects } from '@/hooks/useQueries';

const TYPE_META: Record<string, { icon: any; color: string; label: string; variant: any }> = {
  blog: { icon: BookOpen, color: 'var(--primary)', label: 'Blog Post', variant: 'blue' },
  landing_page: { icon: Layout, color: 'var(--green)', label: 'Landing Page', variant: 'green' },
  cluster: { icon: Network, color: 'var(--yellow)', label: 'Content Cluster', variant: 'yellow' },
  guide: { icon: FileText, color: 'var(--accent)', label: 'Guide', variant: 'accent' },
};

function ContentCard({ idea }: { idea: any }) {
  const meta = TYPE_META[idea.type] ?? TYPE_META.blog;
  const Icon = meta.icon;

  return (
    <div
      className="card"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'transform 180ms, box-shadow 180ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3, margin: '-16px -16px 0',
        background: meta.color, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        opacity: 0.7,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: meta.color,
        }}>
          <Icon size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.4, marginBottom: 4 }}>
            {idea.title}
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
        {idea.description}
      </p>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid var(--border-2)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Target Keyword
          </span>
          <code style={{ fontSize: 11.5, color: 'var(--primary)', fontFamily: 'var(--mono)' }}>
            {idea.targetKeyword}
          </code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} style={{ color: 'var(--green)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>
              +{idea.estimatedTraffic >= 1000
                ? `${(idea.estimatedTraffic / 1000).toFixed(1)}K`
                : idea.estimatedTraffic}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>est. traffic/mo</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const { activeProjectId } = useSeoStore();
  const { data: projects = [] } = useSeoProjects();
  const { data: ideas = [], isLoading } = useSeoContentIdeas(activeProjectId);

  const blogs = (ideas as any[]).filter(i => i.type === 'blog');
  const landings = (ideas as any[]).filter(i => i.type === 'landing_page');
  const clusters = (ideas as any[]).filter(i => i.type === 'cluster' || i.type === 'guide');

  const totalTraffic = (ideas as any[]).reduce((s, i) => s + (i.estimatedTraffic || 0), 0);

  if (!projects.length) {
    return (
      <div className="page-body">
        <div className="card"><EmptyState message="Run a keyword analysis first to generate content ideas" icon="💡" /></div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Stats row */}
      <div className="grid-3 mb-5">
        <div className="stat-tile">
          <div className="stat-label">Content Ideas</div>
          <div className="stat-value mt-1">{isLoading ? '—' : ideas.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Est. Total Traffic</div>
          <div className="stat-value mt-1" style={{ color: 'var(--green)' }}>
            {isLoading ? '—' : totalTraffic >= 1000 ? `${(totalTraffic / 1000).toFixed(1)}K` : totalTraffic}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Content Types</div>
          <div className="stat-value mt-1">{isLoading ? '—' : 4}</div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton height={16} width="80%" />
              <Skeleton height={12} />
              <Skeleton height={12} width="60%" />
            </div>
          ))}
        </div>
      ) : !ideas.length ? (
        <div className="card"><EmptyState message="No content ideas yet" icon="📝" /></div>
      ) : (
        <>
          {/* Blog ideas */}
          {blogs.length > 0 && (
            <section className="mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BookOpen size={15} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Blog Posts</h3>
                <Badge variant="blue">{blogs.length}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {blogs.map((idea: any, i: number) => <ContentCard key={i} idea={idea} />)}
              </div>
            </section>
          )}

          {/* Landing pages */}
          {landings.length > 0 && (
            <section className="mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Layout size={15} style={{ color: 'var(--green)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Landing Pages</h3>
                <Badge variant="green">{landings.length}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {landings.map((idea: any, i: number) => <ContentCard key={i} idea={idea} />)}
              </div>
            </section>
          )}

          {/* Content clusters / guides */}
          {clusters.length > 0 && (
            <section className="mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Network size={15} style={{ color: 'var(--yellow)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Clusters & Guides</h3>
                <Badge variant="yellow">{clusters.length}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {clusters.map((idea: any, i: number) => <ContentCard key={i} idea={idea} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
