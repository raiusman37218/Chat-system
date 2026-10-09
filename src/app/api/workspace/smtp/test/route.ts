import { NextRequest, NextResponse } from 'next/server';
import { guardMember } from '@/lib/team/route-guard';
import { testSmtpConnection, sendSmtpEmail, isValidEmail, getEffectiveFromEmail } from '@/lib/email/smtp';
import { SMTPSettingsConfig } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const guard = await guardMember('manage_settings');
    if (!guard.ok) return guard.response;
    const body = await req.json();
    const { config, sendTestTo } = body as {
      config: SMTPSettingsConfig;
      sendTestTo?: string;
    };

    if (!config || !config.host || !config.port || !config.user || !config.pass) {
      return NextResponse.json(
        { error: 'Missing required SMTP fields (Host, Port, User, Password)' },
        { status: 400 }
      );
    }

    // Normalize config
    const normalizedConfig: SMTPSettingsConfig = {
      ...config,
      host: config.host.trim(),
      port: Number(config.port) || 465,
      user: config.user.trim(),
      pass: config.pass,
      from_name: (config.from_name || '').trim(),
      from_email: (config.from_email && isValidEmail(config.from_email))
        ? config.from_email.trim()
        : config.user.trim(),
    };

    // 1. Verify connection
    const testResult = await testSmtpConnection(normalizedConfig);
    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.message || 'Could not connect to SMTP server' },
        { status: 400 }
      );
    }

    // 2. Optionally send a real test email if an email is provided
    if (sendTestTo) {
      const recipient = sendTestTo.trim();
      if (!isValidEmail(recipient)) {
        return NextResponse.json(
          { error: `Invalid test recipient email "${recipient}". Please enter a valid recipient address (e.g. yourname@gmail.com).` },
          { status: 400 }
        );
      }

      const effectiveSender = getEffectiveFromEmail(normalizedConfig);

      const emailResult = await sendSmtpEmail(normalizedConfig, {
        to: recipient,
        subject: `[SMTP Test] Successful connection from ${normalizedConfig.from_name || 'Support Desk'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; padding: 26px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
            <div style="display: inline-block; background: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 12px;">
              ✓ SMTP VERIFIED &amp; WORKING
            </div>
            <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 20px;">Hostinger SMTP Connected Successfully!</h2>
            <p style="color: #475569; line-height: 1.55; font-size: 14px; margin: 0 0 16px 0;">
              Congratulations! Your Hostinger / custom SMTP credentials are verified and email delivery is working at production level.
            </p>
            <div style="background-color: #f8fafc; padding: 14px 16px; border-radius: 10px; font-size: 13px; color: #475569; border: 1px solid #e2e8f0; line-height: 1.6;">
              <div><strong>Host:</strong> ${normalizedConfig.host}</div>
              <div><strong>Port:</strong> ${normalizedConfig.port} (${normalizedConfig.port === 465 ? 'SSL - Port 465' : 'TLS - Port 587'})</div>
              <div><strong>Sender (&quot;From&quot;):</strong> &quot;${normalizedConfig.from_name || 'Support Desk'}&quot; &lt;${effectiveSender}&gt;</div>
              <div><strong>Authenticated User:</strong> ${normalizedConfig.user}</div>
            </div>
            <p style="font-size: 13px; color: #64748b; margin: 16px 0 0 0; line-height: 1.5;">
              Your customers will now receive automatic email alerts whenever an agent replies to their conversation and they haven&apos;t seen it for 5 minutes.
            </p>
          </div>
        `,
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { error: emailResult.error || 'Connection passed, but failed to send test email' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: sendTestTo
        ? `SMTP verified! A test email has been successfully sent to ${sendTestTo.trim()}`
        : 'Hostinger SMTP connection verified successfully!',
    });
  } catch (error: any) {
    console.error('[SMTP Test Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'SMTP test failed' },
      { status: 500 }
    );
  }
}
