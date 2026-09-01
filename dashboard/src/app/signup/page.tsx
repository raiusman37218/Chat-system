'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles,
  Edit3
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Phase: 'form' (Details) -> 'verify' (6-Digit OTP) -> 'verified' (Success redirect)
  const [phase, setPhase] = useState<'form' | 'verify' | 'verified'>('form');

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 6-digit OTP Inputs
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [devHintCode, setDevHintCode] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill email from query param if available
  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

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
      const { data: authSession, error: loginErr } = await supabase.auth.signInWithPassword({
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

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Back to home */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chatify Homepage</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-600/30 text-white mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {phase === 'form' ? 'Create Business Account' : 'Verify Your Email'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {phase === 'form'
            ? 'Start your free trial • No credit card required'
            : `We sent a 6-digit security code to ${email}`}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PHASE 1: Sign up details */}
        {phase === 'form' && (
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Account Details</h2>
                <p className="text-xs text-slate-400">Step 1 of 2: Administrator Profile</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                14-Day Free Trial
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Work / Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Sending Verification Code...' : 'Verify Email & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Already registered?</span>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign In →
              </Link>
            </div>
          </div>
        )}

        {/* PHASE 2: Intercom 6-Digit Email Verification Screen */}
        {phase === 'verify' && (
          <div className="space-y-6">
            {/* Email info banner */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-slate-200 font-medium truncate">{email}</span>
              </div>
              <button
                onClick={() => setPhase('form')}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 flex-shrink-0 ml-2"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* Dev hint banner so test code is visible */}
            {devHintCode && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
                <span>Verification Code: <strong className="font-mono text-sm tracking-wider text-white">{devHintCode}</strong></span>
                <button
                  onClick={() => {
                    const digits = devHintCode.split('');
                    setOtp(digits);
                    verifyCode(devHintCode);
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px]"
                >
                  Auto-Fill Code
                </button>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-xs font-semibold text-center text-slate-300 mb-3">
                Enter the 6-digit code sent to your inbox:
              </label>

              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-12 text-center text-lg font-bold text-white bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => verifyCode()}
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Verifying...' : 'Verify Code & Create Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Resend Code */}
              <div className="text-center text-xs">
                {resendTimer > 0 ? (
                  <span className="text-slate-500">
                    Resend code in <strong className="text-slate-400 font-mono">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: Verified Success Screen */}
        {phase === 'verified' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Email Verified Successfully!</h2>
            <p className="text-xs text-slate-400">
              Launching your dedicated business workspace setup...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading registration...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
