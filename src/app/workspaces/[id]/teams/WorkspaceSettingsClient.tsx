'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkspaceRole } from '@prisma/client';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Mail, 
  Clock, 
  ChevronLeft,
  Search,
  Check,
  ChevronDown,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';

/* --- Custom Components --- */

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, any> = {
    OWNER: { bg: 'var(--primary-dim)', text: 'var(--primary)', icon: <ShieldCheck size={12} /> },
    ADMIN: { bg: 'rgba(88, 166, 255, 0.1)', text: '#58a6ff', icon: <Shield size={12} /> },
    MEMBER: { bg: 'var(--surface-2)', text: 'var(--text-3)', icon: <Users size={12} /> },
  };
  const s = styles[role] || styles.MEMBER;
  return (
    <span className="badge" style={{ background: s.bg, color: s.text, gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>
      {s.icon}
      {role}
    </span>
  );
}

function CustomRoleSelect({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
  onChange: (val: 'ADMIN' | 'MEMBER') => void; 
  disabled?: boolean 
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  if (disabled) return <RoleBadge role={value} />;

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="btn btn-secondary btn-sm"
        style={{ padding: '6px 10px', borderRadius: 10, gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 100, justifyContent: 'space-between' }}
      >
        <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
        <ChevronDown size={14} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : '' }} className="transition-transform" />
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 140, padding: 6, zIndex: 100, boxShadow: 'var(--shadow-md)', borderRadius: 12 }}>
          {(['MEMBER', 'ADMIN'] as const).map(r => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              className="btn btn-ghost btn-sm w-full"
              style={{ justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8 }}
            >
              <span style={{ fontWeight: value === r ? 600 : 400 }}>{r}</span>
              {value === r && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Main Client Component --- */

export function WorkspaceSettingsClient({
  workspaceId,
  workspaceName,
  actorRole,
  actorUserId,
  canManage,
  initialMembers,
  initialInvitations,
}: {
  workspaceId: string;
  workspaceName: string;
  actorRole: WorkspaceRole;
  actorUserId: string;
  canManage: boolean;
  initialMembers: MemberRow[];
  initialInvitations: InviteRow[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => 
    members.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [members, searchTerm]
  );

  async function reload() {
    const [mRes, iRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/members`, { credentials: 'include' }),
      fetch(`/api/workspaces/${workspaceId}/invitations`, { credentials: 'include' }),
    ]);
    const mData = await mRes.json();
    const iData = await iRes.json();
    if (mRes.ok) setMembers(mData.members);
    if (iRes.ok) setInvitations(iData.invitations);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      setInviteEmail('');
      await reload();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    if (!confirm('Cancel this invitation?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) await reload();
    } finally {
      setBusy(false);
    }
  }

  async function patchRole(membershipId: string, role: 'ADMIN' | 'MEMBER') {
    setError(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${membershipId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Update failed');
      return;
    }
    await reload();
    router.refresh();
  }

  async function removeMemberRow(membershipId: string) {
    if (!confirm('Remove this member from the workspace?')) return;
    setError(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${membershipId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Remove failed');
      return;
    }
    await reload();
    router.refresh();
  }

  return (
    <div className="page-body" style={{ maxWidth: 1200, margin: '0 auto', animation: 'fade-in 400ms ease-out' }}>
      
      {/* Header Section */}
      <header style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/workspaces" className="btn btn-ghost" style={{ padding: 8, borderRadius: '50%', background: 'var(--surface-2)' }}>
            <ChevronLeft size={20} />
          </Link>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Settings</span>
            <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Team & Permissions</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '3.5rem', margin: 0, lineHeight: 1.0 }}>The Collective</h1>
            <p style={{ fontSize: 18, color: 'var(--text-2)', marginTop: 12, maxWidth: 600 }}>
              Managing 12 active collaborators for <span style={{ color: 'var(--text)', fontWeight: 600 }}>{workspaceName}</span>. 
              Changes to roles take effect immediately.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', padding: '12px 20px', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
             <div className="sidebar-avatar" style={{ background: 'var(--primary)', color: 'white' }}>
               {actorRole.charAt(0)}
             </div>
             <div>
               <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>YOUR AUTHORITY</div>
               <RoleBadge role={actorRole} />
             </div>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ padding: '20px 24px', background: 'var(--danger-dim)', color: 'var(--danger)', borderRadius: 20, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--red)', boxShadow: '0 4px 12px rgba(201, 76, 76, 0.1)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Security Alert</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{error}</div>
          </div>
          <button onClick={() => setError(null)} className="btn btn-ghost" style={{ padding: 8 }}>
            <X size={20} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 48, alignItems: 'start' }}>
        
        {/* Main Content: Members List */}
        <section>
          <div style={{ marginBottom: 32 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', margin: 0 }}>Active Roster</h3>
                  <div style={{ background: 'var(--primary-dim)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                    {members.length} Members
                  </div>
                </div>
                <div className="search-wrap">
                  <Search size={16} className="search-icon" style={{ left: 14 }} />
                  <input 
                    type="text" 
                    placeholder="Search by identity..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 280, height: 44, borderRadius: 16, paddingLeft: 42, background: 'var(--surface)', boxShadow: 'var(--shadow)' }}
                  />
                </div>
             </div>

             <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow-md)' }}>
                {filteredMembers.map((m, idx) => (
                  <div
                    key={m.membershipId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '24px 32px',
                      borderBottom: idx === filteredMembers.length - 1 ? 'none' : '1px solid var(--border)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className="hover-surface"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ position: 'relative' }}>
                        <div className="sidebar-avatar" style={{ width: 52, height: 52, fontSize: 18, background: 'var(--surface-3)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                          {m.name.charAt(0)}
                        </div>
                        {m.role === 'OWNER' && (
                          <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: 4, boxShadow: 'var(--shadow)' }}>
                            <ShieldCheck size={14} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          {m.name}
                          {m.userId === actorUserId && (
                            <span style={{ fontSize: 10, background: 'var(--text)', color: 'var(--bg)', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>YOU</span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={12} style={{ opacity: 0.5 }} />
                          {m.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                      <CustomRoleSelect 
                        value={m.role}
                        onChange={(role) => patchRole(m.membershipId, role)}
                        disabled={
                          m.role === 'OWNER' || 
                          !canManage || 
                          m.userId === actorUserId ||
                          !(actorRole === 'OWNER' || (actorRole === 'ADMIN' && m.role === 'MEMBER'))
                        }
                      />

                      {canManage && m.role !== 'OWNER' && m.userId !== actorUserId && (actorRole === 'OWNER' || (actorRole === 'ADMIN' && m.role === 'MEMBER')) ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ color: 'var(--red)', padding: 10, borderRadius: 12, background: 'var(--danger-dim)' }}
                          onClick={() => removeMemberRow(m.membershipId)}
                          title="Revoke Permission"
                        >
                          <Trash2 size={20} />
                        </button>
                      ) : (
                        <div style={{ width: 40 }} />
                      )}
                    </div>
                  </div>
                ))}

                {filteredMembers.length === 0 && (
                  <div style={{ padding: '100px 24px', textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 24, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', transform: 'rotate(-5deg)' }}>
                      <Search size={32} style={{ opacity: 0.2 }} />
                    </div>
                    <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: 8 }}>Identity drift</h4>
                    <p style={{ fontSize: 15, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto' }}>We couldn't find any collaborators matching your search terms.</p>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Sidebar: Invites & Actions */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* Invite Card */}
          {canManage && (
            <div className="card" style={{ padding: 32, borderRadius: 32, border: '1px solid var(--primary)', background: 'var(--surface)', position: 'relative', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ position: 'absolute', top: 24, right: 24, padding: '4px 12px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>SECURE</div>
              
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font)', marginBottom: 8 }}>Onboard Talent</h3>
                <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  Grow your workspace by inviting collaborators with managed permissions.
                </p>
              </div>

              <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-2)' }}>EMAIL ADDRESS</label>
                  <div className="relative">
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input
                      type="email"
                      placeholder="teammate@agency.co"
                      required
                      className="form-input"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{ borderRadius: 16, padding: '14px 14px 14px 44px', background: 'var(--bg)', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-2)' }}>PERMISSION LEVEL</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--surface-2)', padding: 6, borderRadius: 18 }}>
                    {(['MEMBER', 'ADMIN'] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        style={{
                          padding: '10px',
                          borderRadius: 14,
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          background: inviteRole === role ? 'var(--primary)' : 'transparent',
                          color: inviteRole === role ? 'white' : 'var(--text-3)',
                          boxShadow: inviteRole === role ? 'var(--shadow-md)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', height: 52, borderRadius: 18, fontWeight: 700, fontSize: 15, display: 'flex', justifyContent: 'center', gap: 12, border: 'none', boxShadow: 'var(--shadow-md)' }}>
                   {busy ? 'Dispatching...' : (
                    <>
                      Extend Invitation
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Pending Invites List */}
          {invitations.length > 0 && (
            <div className="card" style={{ padding: 28, borderRadius: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Awaiting Join</h3>
                <div style={{ marginLeft: 'auto', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{invitations.length}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {invitations.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', truncate: true }} title={inv.email}>
                        {inv.email}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span className="badge badge-gray" style={{ background: 'var(--surface)', fontSize: 9 }}>{inv.role}</span>
                        <span>• {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {canManage && (
                      <button 
                        onClick={() => deleteInvite(inv.id)} 
                        className="btn btn-ghost" 
                        style={{ padding: 6, color: 'var(--text-3)', borderRadius: '50%' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Banner */}
          <div className="card" style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: 32, borderRadius: 32, position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <Shield size={120} />
             </div>
             <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', marginBottom: 12, color: 'inherit' }}>Ironclad Security</h4>
             <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
               Your team's access is secured with enterprise-grade encryption. Every invitation is cryptographically signed and time-limited.
             </p>
          </div>
        </aside>

      </div>
    </div>
  );
}

type MemberRow = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
};
