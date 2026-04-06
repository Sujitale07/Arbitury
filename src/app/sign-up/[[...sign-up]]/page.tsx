import { SignUp } from '@clerk/nextjs';
import { Leaf, Sparkles, ShieldCheck, Zap } from 'lucide-react';

type Props = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const sp = await searchParams;
  const fallback = sp.redirect_url?.startsWith('/') ? sp.redirect_url : '/workspaces';

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw', 
      background: 'var(--bg)',
      overflow: 'hidden'
    }}>
      {/* Left side - Branding & Info */}
      <div style={{ 
        flex: 1, 
        padding: '60px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        position: 'relative'
      }} className="hide-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 80 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}>
            <Leaf size={24} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--serif)', letterSpacing: '-0.02em' }}>
            Arbitury Pro
          </span>
        </div>

        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: 24, fontFamily: 'var(--serif)' }}>
            Start your journey with <span style={{ color: 'var(--primary)' }}>Arbitury.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-2)', marginBottom: 48 }}>
            Join thousands of organic wellness brands scaling their business with AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--primary)', marginTop: 4 }}><Sparkles size={20} /></div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Intuitive Dashboard</h3>
                <p style={{ color: 'var(--text-3)' }}>Everything you need to manage seeds, inventory, and sales.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--primary)', marginTop: 4 }}><ShieldCheck size={20} /></div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Enterprise Security</h3>
                <p style={{ color: 'var(--text-3)' }}>Your data is protected with industry-leading encryption.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--primary)', marginTop: 4 }}><Zap size={20} /></div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Rapid Onboarding</h3>
                <p style={{ color: 'var(--text-3)' }}>Get up and running in minutes, not days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background element */}
        <div style={{ 
          position: 'absolute', 
          bottom: -100, 
          left: -100, 
          width: 400, 
          height: 400, 
          borderRadius: '50%', 
          background: 'var(--primary-dim)', 
          filter: 'blur(80px)',
          opacity: 0.5,
          zIndex: 0
        }} />
      </div>

      {/* Right side - Signup Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: 400, zIndex: 1 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }} className="show-mobile-only">
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Leaf size={20} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--serif)' }}>Arbitury Pro</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create your account</h2>
          </div>
          <SignUp 
            fallbackRedirectUrl={fallback} 
            signInUrl="/sign-in" 
            appearance={{
              elements: {
                formButtonPrimary: 'btn-primary-clerk',
                card: 'clerk-card-custom',
                headerTitle: 'clerk-header-title',
                headerSubtitle: 'clerk-header-subtitle',
              }
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .show-mobile-only { display: block !important; }
        }
        @media (min-width: 901px) {
          .show-mobile-only { display: none !important; }
        }
        .clerk-card-custom {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .clerk-header-title {
          font-family: var(--serif) !important;
          font-size: 1.75rem !important;
        }
        .btn-primary-clerk {
          background-color: var(--primary) !important;
          border-radius: 8px !important;
        }
      `}} />
    </div>
  );
}
