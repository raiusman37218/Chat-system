'use server';

import { serviceClient } from '@/lib/supabase/service';
import { sendSmtpEmail, generateVerificationCodeEmailHtml, isValidEmail } from '@/lib/email/smtp';
import { SMTPSettingsConfig } from '@/types/database';

/**
 * Generates a cryptographically sound 6-digit OTP code
 */
function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Server Action: Start user registration and dispatch 6-digit OTP verification email from ZenTry
 */
export async function sendSignupVerificationCodeAction(params: {
  email: string;
  name: string;
  password?: string;
}): Promise<{ success: boolean; error?: string; email?: string; warning?: string; code?: string }> {
  try {
    const normalizedEmail = (params.email || '').trim().toLowerCase();
    const cleanName = (params.name || '').trim();

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name or company name.' };
    }

    const supabaseAdmin = serviceClient();

    // 1. Check if user already exists in auth
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[Verification] Error checking existing user:', listError);
    }

    const existingUser = (listData?.users || []).find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // If user exists and is already verified
      if (existingUser.email_confirmed_at || (existingUser as any).confirmed_at) {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }

      // If user exists but is unconfirmed, update password if provided
      if (params.password) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: params.password,
          user_metadata: { name: cleanName },
        });
      }
    } else if (params.password) {
      // Create user unconfirmed in Supabase Auth
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: params.password,
        email_confirm: false,
        user_metadata: { name: cleanName },
      });

      if (createError) {
        console.error('[Verification] Error creating staged user:', createError);
        return { success: false, error: createError.message };
      }
    }

    // 2. Generate 6-digit OTP Code
    const code = generate6DigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Clear old unverified codes for this email
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('email', normalizedEmail);

    // Save fresh code
    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[Verification] Error storing verification code:', insertError);
      return { success: false, error: 'Failed to generate verification code. Please try again.' };
    }

    // 3. Dispatch official ZenTry verification email via Platform SMTP
    const { data: platformData } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    const smtpConfig = platformData?.smtp_settings as SMTPSettingsConfig | null;

    let warning: string | undefined = undefined;

    if (smtpConfig && smtpConfig.user && smtpConfig.pass && smtpConfig.enabled) {
      const emailHtml = generateVerificationCodeEmailHtml({
        code,
        name: cleanName,
        platformName: platformData?.platform_name || 'ZenTry',
        platformUrl: platformData?.platform_url || 'https://zen-try.site',
      });

      const sendResult = await sendSmtpEmail(smtpConfig, {
        to: normalizedEmail,
        subject: `${code} is your ZenTry verification code`,
        html: emailHtml,
      });

      if (!sendResult.success) {
        console.error('[Verification] SMTP dispatch failed:', sendResult.error);
        warning = sendResult.error || 'Failed to dispatch email';
      }
    } else {
      console.warn('[Verification] Platform SMTP not configured yet. Code generated:', code);
      warning = 'Platform SMTP credentials are not configured or active.';
    }

    return {
      success: true,
      email: normalizedEmail,
      warning,
      code: warning ? code : undefined,
    };
  } catch (err: any) {
    console.error('[Verification] Unexpected error sending code:', err);
    return { success: false, error: err.message || 'Failed to dispatch verification email.' };
  }
}

/**
 * Server Action: Verify 6-digit OTP code entered/pasted by user
 */
export async function verifySignupCodeAction(params: {
  email: string;
  code: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = (params.email || '').trim().toLowerCase();
    const cleanCode = (params.code || '').replace(/\D/g, '').trim();

    if (!normalizedEmail) {
      return { success: false, error: 'Email address is missing.' };
    }

    if (cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    const supabaseAdmin = serviceClient();

    // 1. Look up valid code in email_verifications
    const { data: record, error: lookupError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', cleanCode)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError || !record) {
      return {
        success: false,
        error: 'Invalid or expired verification code. Please check your email or request a new one.',
      };
    }

    // 2. Code is valid! Delete consumed verification record
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('email', normalizedEmail);

    // 3. Mark user confirmed in Supabase Auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = (listData?.users || []).find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (targetUser) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('[Verification] Error confirming user email:', confirmError);
        return { success: false, error: 'Failed to activate user account. Please try again.' };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Verification] Error verifying code:', err);
    return { success: false, error: err.message || 'Verification failed.' };
  }
}

/**
 * Server Action: Resend fresh 6-digit OTP code to user
 */
export async function resendSignupVerificationCodeAction(params: {
  email: string;
  name?: string;
}): Promise<{ success: boolean; error?: string; email?: string; warning?: string; code?: string }> {
  return sendSignupVerificationCodeAction({
    email: params.email,
    name: params.name || 'Business Owner',
  });
}
