'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MailOpen, CheckCircle2, AlertCircle, Loader2, Building2, UserPlus, ArrowRight } from 'lucide-react';

type Preview =
  | { loading: true }
  | { loading: false; valid: false; message: string }
  | {
      loading: false;
      valid: true;
      workspaceName: string;
      role: string;
      email: string;
    };

function InviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [preview, setPreview] = useState<Preview>({ loading: true });
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const signInRedirectUrl = token
    ? `/sign-in?redirect_url=${encodeURIComponent(`/invite?token=${encodeURIComponent(token)}`)}`
    : '/sign-in';

  useEffect(() => {
    if (!token) {
      setPreview({ loading: false, valid: false, message: 'Missing invitation token.' });
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (cancelled) return;
      if (!data.valid) {
        setPreview({
          loading: false,
          valid: false,
          message: data.error || 'This invitation is invalid or has expired.',
        });
        return;
      }
      setPreview({
        loading: false,
        valid: true,
        workspaceName: data.workspaceName,
        role: data.role,
        email: data.email,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    if (!token) return;
    setAcceptError(null);
    setAccepting(true);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAcceptError(data.error || 'Could not accept invitation.');
        return;
      }
      router.push(`/workspaces/${data.workspaceId}`);
      router.refresh();
    } finally {
      setAccepting(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    maxWidth: 480,
    width: '100%',
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20
  };

  if (!token) {
    return (
      <div className="card" style={cardStyle}>
        <div style={{ color: 'var(--red)', marginBottom: 8 }}><AlertCircle size={48} strokeWidth={1.5} /></div>
        <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Missing Invitation</h2>
        <p className="card-subtitle">It looks like the link is incomplete. Please check the email we sent you.</p>
        <Link href="/workspaces" className="btn btn-secondary" style={{ marginTop: 12 }}>
          Go to workspaces
        </Link>
      </div>
    );
  }

  if (preview.loading) {
    return (
      <div className="card" style={cardStyle}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: 8 }} />
        <p className="card-subtitle">Verifying your invitation…</p>
      </div>
    );
  }

  if (!preview.valid) {
    return (
      <div className="card" style={cardStyle}>
        <div style={{ color: 'var(--red)', marginBottom: 8 }}><AlertCircle size={48} strokeWidth={1.5} /></div>
        <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Invite not found</h2>
        <p style={{ color: 'var(--red)' }}>{preview.message}</p>
        <Link href="/workspaces" className="btn btn-secondary" style={{ marginTop: 24 }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const primary = user?.primaryEmailAddress?.emailAddress;
  const emailMismatch =
    isLoaded &&
    user &&
    primary &&
    primary.trim().toLowerCase() !== preview.email.trim().toLowerCase();

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        width: 80, 
        height: 80, 
        borderRadius: 24, 
        background: 'var(--primary-dim)', 
        color: 'var(--primary)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 8
      }}>
        <MailOpen size={40} />
      </div>

      <div>
        <h2 className="card-title" style={{ fontSize: '2rem', marginBottom: 12 }}>You&apos;re invited!</h2>
        <p className="card-subtitle" style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>
          Join <strong style={{ color: 'var(--text)' }}>{preview.workspaceName}</strong> as a <span className="badge badge-blue">{preview.role}</span>.
        </p>
      </div>

      <div style={{ 
        background: 'var(--surface-2)', 
        padding: '16px 24px', 
        borderRadius: 12, 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid var(--border)'
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={16} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>INVITED EMAIL</p>
          <p style={{ fontWeight: 600 }}>{preview.email}</p>
        </div>
      </div>

      {!authLoaded ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
          <Loader2 className="animate-spin" size={16} /> Loading account…
        </div>
      ) : !isSignedIn ? (
        <div style={{ width: '100%', marginTop: 12 }}>
          <p className="card-subtitle" style={{ marginBottom: 20 }}>
            Please sign in with the invited email address to join the workspace.
          </p>
          <Link href={signInRedirectUrl} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 12 }}>
            Sign in to join <ArrowRight size={18} />
          </Link>
        </div>
      ) : emailMismatch ? (
        <div style={{ marginTop: 12, padding: 16, background: 'rgba(var(--red-rgb), 0.05)', border: '1px solid var(--red)', borderRadius: 12 }}>
          <p style={{ color: 'var(--red)', fontSize: '0.95rem' }}>
            <strong>Email Mismatch:</strong> You&apos;re currently signed in as <strong>{primary}</strong>. 
            Please sign out and sign in with <strong>{preview.email}</strong> to accept this invitation.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: 12 }}>
          {acceptError && (
            <p style={{ color: 'var(--red)', marginBottom: 16, fontSize: '0.95rem' }} role="alert">
              {acceptError}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 12, fontSize: '1.1rem' }}
            disabled={accepting || !isLoaded}
            onClick={() => accept()}
          >
            {accepting ? (
              <><Loader2 className="animate-spin" size={20} /> Accepting…</>
            ) : (
              <><UserPlus size={20} /> Join the Workspace</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function InviteClient() {
  return (
    <Suspense
      fallback={
        <div className="card" style={{ maxWidth: 440, padding: 40, textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
          <p className="card-subtitle">Loading invitation data…</p>
        </div>
      }
    >
      <InviteInner />
    </Suspense>
  );
}

