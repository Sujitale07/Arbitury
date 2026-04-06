'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WorkspaceRole } from '@prisma/client';
import { Plus, Trash2, Building2, ExternalLink, Shield, ShieldCheck, Search } from 'lucide-react';

export type WorkspaceRow = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: Date;
};

export function WorkspacesClient({
  initialWorkspaces,
}: {
  initialWorkspaces: WorkspaceRow[];
}) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function refresh() {
    const res = await fetch('/api/workspaces', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    setWorkspaces(data.workspaces);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this workspace? This cannot be undone.')) return;
    setError(null);
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { error?: string }).error || 'Delete failed');
      return;
    }
    await refresh();
  }

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: 8, color: 'var(--text)' }}>Workspaces</h1>
          <p className="card-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-3)' }}>
            Manage your businesses, collaborate with teams.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              className="search-input" 
              placeholder="Search workspaces..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
          </div>
        </div>
      </header>

      <section style={{ marginBottom: 48 }}>
        <div className="card" style={{ padding: '24px', borderStyle: 'dashed', background: 'transparent' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'var(--primary-dim)', 
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Plus size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <input
                placeholder="Name your new workspace (e.g. Acme Studio)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  fontSize: '1.1rem', 
                  padding: '8px 0',
                  borderRadius: 0,
                  borderBottom: '1px solid var(--border)'
                }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !name.trim()}
              style={{ padding: '10px 24px', borderRadius: 12 }}
            >
              {loading ? 'Creating…' : 'Create New'}
            </button>
          </form>
          {error && <p className="form-error" style={{ marginTop: 12, marginLeft: 64 }}>{error}</p>}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {filteredWorkspaces.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 0' }}>
            <Building2 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p style={{ fontSize: '1.1rem' }}>No workspaces found. Time to build something new!</p>
          </div>
        ) : (
          filteredWorkspaces.map((w) => (
            <div 
              key={w.id} 
              className="card" 
              style={{ 
                padding: 24, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 20, 
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 10, 
                  background: 'var(--surface-3)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-2)'
                }}>
                  <Building2 size={24} />
                </div>
                <div className={`badge ${w.role === 'OWNER' ? 'badge-blue' : 'badge-gray'}`} style={{ gap: 4 }}>
                  {w.role === 'OWNER' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {w.role}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>{w.name}</h3>
                <p className="card-subtitle">Created {new Date(w.createdAt).toLocaleDateString()}</p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link 
                  href={`/workspaces/${w.id}`} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center', gap: 8 }}
                >
                  Enter Workspace <ExternalLink size={14} />
                </Link>
                {w.role === 'OWNER' && (
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    onClick={() => handleDelete(w.id)}
                    style={{ color: 'var(--red)', marginLeft: 8 }}
                    title="Delete Workspace"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

