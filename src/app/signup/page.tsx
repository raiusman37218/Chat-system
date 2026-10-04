'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthAside, AuthShell } from '@/components/marketing/AuthShell';
import { GoogleButton } from '@/components/marketing/GoogleButton';
import { isProviderEnabled, useProviderEnabled } from '@/lib/auth/providers';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Phase: 'form' (Details) -> 'check_inbox' (Email confirmation) -> 'verified' (Success redirect)
  const [phase, setPhase] = useState<'form' | 'check_inbox' | 'verified'>('form');

  // Form Inputs - initialize email from query param if available
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);

  // undefined while we ask Supabase which providers are switched on.
  const googleEnabled = useProviderEnabled('google');
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    return searchParams.get('error_description') || searchParams.get('error') || null;
  });

  const [resendTimer, setResendTimer] = useState<number>(30);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'check_inbox' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, resendTimer]);

  // Password rules validation
  const ruleLength = password.length >= 8;
  const ruleNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const ruleCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const allPasswordRulesMet = ruleLength && ruleNumberOrSpecial && ruleCase;

  // Google OAuth Signup
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);

    if (!(await isProviderEnabled('google'))) {
      setGoogleLoading(false);
      setErrorMsg('Google sign-up is not enabled yet — use email below for now.');
      return;
    }

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || '');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/onboarding`,
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
            'Google Sign-Up is not enabled yet in your Supabase project. Please register with work email below.'
          );
        } else {
          setErrorMsg(error.message);
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google signup error:', err);
      setErrorMsg(err.message || 'Failed to initiate Google sign-up.');
      setGoogleLoading(false);
    }
  };

  // Submit Account Registration (Supabase email confirmation)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTermsError(false);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!allPasswordRulesMet) {
      setErrorMsg('Please ensure your password meets all the security requirements below.');
      return;
    }

    if (!agreedToTerms) {
      setTermsError(true);
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || '');

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrorMsg('An account with this email already exists. Please sign in instead.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      // If user is already confirmed (e.g. email confirmations turned off in dev)
      if (data?.user?.email_confirmed_at || (data?.user as any)?.confirmed_at) {
        setPhase('verified');
        setTimeout(() => {
          router.push('/onboarding');
          router.refresh();
        }, 1200);
        return;
      }

      // Require email verification screen
      setPhase('check_inbox');
      setResendTimer(30);
      setResendSuccess(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Failed to initiate account registration.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Confirmation Link
  const handleResendEmail = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    setResendSuccess(false);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || '');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) throw error;

      setResendSuccess(true);
      setResendTimer(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  // Check if User Has Verified Their Email
  const handleCheckVerification = async () => {
    setCheckLoading(true);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at || (user as any)?.confirmed_at) {
        setPhase('verified');
        setTimeout(() => {
          router.push('/onboarding');
          router.refresh();
        }, 1200);
        return;
      }

      setErrorMsg('Email not verified yet. Please check your inbox and click the confirmation link.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error checking verification status.');
    } finally {
      setCheckLoading(false);
    }
  };

  /* ---------------------------------------------------------------- render */

  if (phase === 'verified') {
    return (
      <div className="text-center animate-pop">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-success-soft border border-success-line text-success flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="mt-6 text-[1.6rem] font-semibold">Email verified!</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Setting up your workspace…
        </p>
        <div className="mt-6 mx-auto w-32 h-1 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-accent animate-breathe" />
        </div>
      </div>
    );
  }

  if (phase === 'check_inbox') {
    return (
      <div className="animate-rise">
        <button
          type="button"
          onClick={() => {
            setPhase('form');
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Edit email or details
        </button>

        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/20 text-accent flex items-center justify-center shadow-xs">
          <Mail className="w-6 h-6 stroke-[1.8]" />
        </div>

        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold">
          Check your inbox
        </h1>
        <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-semibold text-ink">{email}</span>. Click the link in the email to activate your account and start setting up your workspace.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3 text-[12.5px] text-danger animate-pop"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resendSuccess && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-success-line bg-success-soft px-3.5 py-3 text-[12.5px] text-success animate-pop"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>A fresh verification link has been sent to your email.</span>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checkLoading}
            className="btn btn-lg btn-primary w-full"
          >
            {checkLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
                Checking status…
              </>
            ) : (
              <>
                I&apos;ve verified my email
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="panel p-3.5 text-center text-[12px] text-ink-3">
            Can&apos;t find the email? Check your spam folder or promotions tab.
          </div>
        </div>

        <div className="mt-5 text-center text-[12.5px] text-ink-3">
          Didn&apos;t receive the email?{' '}
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resendTimer > 0 || resending}
            className="inline-flex items-center gap-1.5 font-medium text-accent disabled:text-ink-3 disabled:cursor-not-allowed hover:underline underline-offset-4 disabled:no-underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend email'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[1.75rem] leading-tight font-semibold">
          Create your workspace
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Free forever tier. No credit card required.
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

      {googleEnabled && (
        <>
          <GoogleButton
            onClick={handleGoogleSignup}
            loading={googleLoading}
            disabled={loading}
            text="Sign up with Google"
          />

          <div className="relative my-6 text-center text-[12px] text-ink-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line-2" />
            </div>
            <span className="relative bg-surface px-3 text-ink-3">
              or register with work email
            </span>
          </div>
        </>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>

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
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Password rules checklist under the field */}
          <div className="mt-2.5 rounded-xl border border-line-2 bg-surface-2/60 p-3 space-y-1.5 text-[12px]">
            <span className="font-medium text-ink-2 block mb-1">
              Password requirements:
            </span>
            <div className="space-y-1">
              <div
                className={`flex items-center gap-2 transition-colors ${
                  ruleLength ? 'text-success font-medium' : 'text-ink-3'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    ruleLength
                      ? 'bg-success text-white'
                      : 'border border-line-2 bg-surface'
                  }`}
                >
                  {ruleLength && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                </div>
                <span>At least 8 characters</span>
              </div>

              <div
                className={`flex items-center gap-2 transition-colors ${
                  ruleCase ? 'text-success font-medium' : 'text-ink-3'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    ruleCase
                      ? 'bg-success text-white'
                      : 'border border-line-2 bg-surface'
                  }`}
                >
                  {ruleCase && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                </div>
                <span>Uppercase & lowercase letters</span>
              </div>

              <div
                className={`flex items-center gap-2 transition-colors ${
                  ruleNumberOrSpecial ? 'text-success font-medium' : 'text-ink-3'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    ruleNumberOrSpecial
                      ? 'bg-success text-white'
                      : 'border border-line-2 bg-surface'
                  }`}
                >
                  {ruleNumberOrSpecial && (
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  )}
                </div>
                <span>At least 1 number or special character</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox with links to Terms and Privacy Policy */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (e.target.checked) setTermsError(false);
              }}
              className={`mt-0.5 w-4 h-4 rounded border ${
                termsError ? 'border-danger ring-1 ring-danger' : 'border-line-2'
              } text-accent focus:ring-accent bg-surface transition-all cursor-pointer`}
            />
            <span className="text-[12.5px] text-ink-2 leading-snug">
              I agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-ink underline underline-offset-4 hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-ink underline underline-offset-4 hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn btn-lg btn-primary w-full !mt-5 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[12.5px] text-ink-3">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-ink hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthShell
      aside={
        <AuthAside
          eyebrow="Get started"
          headline={
            <>
              Two minutes from
              <br />
              sign-up to live chat.
            </>
          }
          points={[
            {
              title: 'Create the workspace',
              body: 'Your business, your branding, your agent profile — provisioned instantly.',
            },
            {
              title: 'Paste one script tag',
              body: 'Works on WordPress, Shopify, Webflow, Next.js and plain HTML alike.',
            },
            {
              title: 'Start answering',
              body: 'Visitors appear in your inbox the moment they open the messenger.',
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
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
