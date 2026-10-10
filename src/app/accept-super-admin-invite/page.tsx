'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { acceptSuperAdminInviteAction } from '@/app/actions/platform';
import { Button } from '@/components/ui/Button';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) {
      setError('Missing invitation token.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await acceptSuperAdminInviteAction(token);
      if (!res.success) {
        setError(res.error || 'Failed to accept invitation.');
      } else {
        setSuccessEmail(res.email || 'your email');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-canvas p-4 text-ink">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-semibold bg-accent/10 text-accent uppercase tracking-wider mb-2">
              ZenTry Platform Super Admin
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {successEmail ? 'Access Activated!' : 'Accept Super Admin Access'}
            </h1>
          </div>
          <p className="text-xs text-ink-3 max-w-sm">
            {successEmail
              ? `Your account has been granted Platform Super Admin privileges. You can now log in using the password provided by the platform owner.`
              : `The platform owner has granted you Platform Super Admin access to ZenTry. Accept the invitation below to activate your administrative privileges.`}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 flex items-start gap-3 text-xs text-danger">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {successEmail ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-success/30 bg-success/5 flex items-center gap-3 text-xs text-success">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <strong className="block font-semibold">Ready to Sign In</strong>
                <span>Activated for <span className="font-mono text-ink">{successEmail}</span></span>
              </div>
            </div>

            <Button
              className="w-full justify-center"
              size="lg"
              onClick={() => router.push(`/login?email=${encodeURIComponent(successEmail)}`)}
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!token ? (
              <div className="p-4 rounded-xl border border-warn/30 bg-warn/5 text-xs text-warn text-center">
                Invalid or missing invitation link. Please verify the link in your email.
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl border border-line bg-surface-2 text-2xs text-ink-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Lock className="w-3.5 h-3.5 text-accent" />
                    Credentials Note
                  </div>
                  <p>
                    Your login password was set by the platform owner and sent directly to your email.
                  </p>
                </div>

                <Button
                  className="w-full justify-center"
                  size="lg"
                  loading={loading}
                  onClick={handleAccept}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Accept & Activate Privileges</span>
                </Button>
              </>
            )}

            <div className="text-center pt-2">
              <a
                href="/login"
                className="text-xs text-ink-3 hover:text-ink underline transition-colors"
              >
                Already accepted? Sign in here
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AcceptSuperAdminInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
