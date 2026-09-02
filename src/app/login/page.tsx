'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthAside, AuthShell } from '@/components/marketing/AuthShell';
import { GoogleButton } from '@/components/marketing/GoogleButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check for error parameters in URL (e.g. from OAuth redirect)
  useEffect(() => {
    const err = searchParams.get('error');
    const desc = searchParams.get('error_description');
    if (err || desc) {
      setErrorMsg(desc || err);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:3000';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('not enabled') ||
          error.message.toLowerCase().includes('unsupported provider')
        ) {
          setErrorMsg(
            'Google Sign-In is not enabled yet in your Supabase project. Please enable Google in Supabase Dashboard > Authentication > Providers > Google, or sign in with email below.'
          );
        } else {
          setErrorMsg(error.message);
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Failed to initiate Google sign-in.');
      setGoogleLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('agent@chatify.io');
    setPassword('ChatifyDemo2026!');
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[1.75rem] leading-tight font-semibold">
          Welcome back
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Sign in to your support inbox.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3 text-[12.5px] text-danger animate-pop"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google 1-Click Sign-In */}
      <GoogleButton
        onClick={handleGoogleLogin}
        loading={googleLoading}
        disabled={loading}
        text="Continue with Google"
      />

      {/* Separator */}
      <div className="relative my-6 text-center text-[12px] text-ink-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line-2" />
        </div>
        <span className="relative bg-surface px-3 text-ink-3">
          or continue with email
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="field-label">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn btn-lg btn-primary w-full !mt-6"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 hairline" />

      <div className="mt-5 flex items-center justify-between text-[12.5px]">
        <button
          type="button"
          onClick={handleDemoFill}
          className="font-medium text-accent hover:underline underline-offset-4"
        >
          Use demo credentials
        </button>
        <span className="text-ink-3">
          No account?{' '}
          <Link
            href="/signup"
            className="font-medium text-ink hover:underline underline-offset-4"
          >
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      aside={
        <AuthAside
          eyebrow="Agent workspace"
          headline={
            <>
              One inbox for every
              <br />
              conversation on your site.
            </>
          }
          points={[
            {
              title: 'Live visitor radar',
              body: 'See who is browsing, which page they are on, and how long they have been there.',
            },
            {
              title: 'Sub-second delivery',
              body: 'Messages, typing indicators and read receipts stream over WebSockets.',
            },
            {
              title: 'Private team notes',
              body: 'Leave context for a teammate inside the thread. The customer never sees it.',
            },
          ]}
        />
      }
    >
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-2/3 rounded-lg bg-surface-3" />
            <div className="h-11 w-full rounded-xl bg-surface-3" />
            <div className="h-11 w-full rounded-xl bg-surface-3" />
            <div className="h-11 w-full rounded-xl bg-surface-3" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
