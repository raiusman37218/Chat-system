'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthAside, AuthShell } from '@/components/marketing/AuthShell';
import { GoogleButton } from '@/components/marketing/GoogleButton';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Phase: 'form' (Details) -> 'verify' (6-Digit OTP) -> 'verified' (Success redirect)
  const [phase, setPhase] = useState<'form' | 'verify' | 'verified'>('form');

  // Form Inputs - initialize email from query param if available
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    return searchParams.get('error_description') || searchParams.get('error') || null;
  });

  // 6-digit OTP Inputs
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [devHintCode, setDevHintCode] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, resendTimer]);

  // Google OAuth Signup
  const handleGoogleSignup = async () => {
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
            'Google Sign-Up is not enabled yet in your Supabase project. Please enable Google in Supabase Dashboard > Authentication > Providers > Google, or register with work email below.'
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

  // 1. Submit Account Registration & Generate Code
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Step A: Register user and generate 6-digit verification code
      const { data: regData, error: regErr } = await supabase.rpc('fn_register_user', {
        p_email: email.trim().toLowerCase(),
        p_password: password,
        p_name: name.trim(),
      });

      if (regErr || !regData || regData.success === false) {
        throw new Error(regData?.error || regErr?.message || 'Failed to initiate account registration.');
      }

      setDevHintCode(regData.code);
      setPhase('verify');
      setResendTimer(30);

      // Focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Failed to initiate account registration.');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP Input Handler
  const handleOtpChange = (index: number, val: string) => {
    // Handle pasted full 6-digit code
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      if (digits.length === 6) {
        verifyCode(newOtp.join(''));
      }
      return;
    }

    const cleanChar = val.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanChar && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (cleanChar && index === 5 && newOtp.every((d) => d !== '')) {
      verifyCode(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // 3. Verify Code
  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc('fn_verify_email_code', {
        p_email: email.trim().toLowerCase(),
        p_code: code,
      });

      if (error || !data || data.success === false) {
        throw new Error(data?.error || 'Invalid or expired verification code.');
      }

      // Automatically sign in the verified user
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginErr) {
        throw loginErr;
      }

      setPhase('verified');

      setTimeout(() => {
        router.push('/onboarding');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend Code
  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc('fn_generate_verification_code', {
        p_email: email.trim().toLowerCase(),
      });
      if (error) throw error;

      setDevHintCode(data);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- render */

  if (phase === 'verified') {
    return (
      <div className="text-center animate-pop">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-success-soft border border-success-line text-success flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="mt-6 text-[1.6rem] font-semibold">Email verified</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Setting up your workspace…
        </p>
        <div className="mt-6 mx-auto w-32 h-1 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-accent animate-breathe" />
        </div>
      </div>
    );
  }

  if (phase === 'verify') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setPhase('form');
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Edit details
        </button>

        <div className="w-11 h-11 rounded-xl bg-accent-soft border border-accent-line text-accent flex items-center justify-center">
          <KeyRound className="w-5 h-5" />
        </div>

        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold">
          Check your email
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-ink">{email}</span>
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

        <div className="mt-7 flex gap-2 justify-between">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                otpInputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              className="w-full aspect-square max-w-[54px] rounded-xl border border-line-2 bg-surface text-center text-[20px] font-semibold text-ink focus:outline-none focus:border-accent focus:shadow-[var(--ds-ring)] transition-all"
            />
          ))}
        </div>

        {devHintCode && (
          <div className="mt-4 panel px-3.5 py-2.5 flex items-center justify-between text-[12px]">
            <span className="text-ink-3">Dev code (email not wired yet)</span>
            <span className="font-mono font-semibold tracking-[0.2em] text-ink">
              {devHintCode}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => verifyCode()}
          disabled={loading}
          className="btn btn-lg btn-primary w-full mt-6"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
              Verifying…
            </>
          ) : (
            <>
              Verify and continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-5 text-center text-[12.5px] text-ink-3">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendTimer > 0 || loading}
            className="inline-flex items-center gap-1.5 font-medium text-accent disabled:text-ink-3 disabled:cursor-not-allowed hover:underline underline-offset-4 disabled:no-underline"
          >
            <RefreshCw className="w-3 h-3" />
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
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

      {/* Google 1-Click Sign-Up */}
      <GoogleButton
        onClick={handleGoogleSignup}
        loading={googleLoading}
        disabled={loading}
        text="Sign up with Google"
      />

      {/* Separator */}
      <div className="relative my-6 text-center text-[12px] text-ink-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line-2" />
        </div>
        <span className="relative bg-surface px-3 text-ink-3">
          or register with work email
        </span>
      </div>

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
              placeholder="At least 6 characters"
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
