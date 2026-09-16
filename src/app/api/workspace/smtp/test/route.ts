import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection, sendSmtpEmail } from '@/lib/email/smtp';
import { SMTPSettingsConfig } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
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

    // 1. Verify connection
    const testResult = await testSmtpConnection(config);
    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.message || 'Could not connect to SMTP server' },
        { status: 400 }
      );
    }

    // 2. Optionally send a real test email if an email is provided
    if (sendTestTo) {
      const emailResult = await sendSmtpEmail(config, {
        to: sendTestTo,
        subject: `[SMTP Test] Successful connection from ${config.from_name || 'Support Desk'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">✓ Hostinger SMTP Connected Successfully!</h2>
            <p style="color: #334155; line-height: 1.5;">
              Congratulations! Your Hostinger / custom SMTP credentials are verified and working perfectly.
            </p>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; color: #64748b; margin: 16px 0;">
              <div><strong>Host:</strong> ${config.host}</div>
              <div><strong>Port:</strong> ${config.port} (Secure: ${config.port === 465 ? 'SSL' : 'TLS'})</div>
              <div><strong>Sender:</strong> ${config.from_email || config.user}</div>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
              Your customers will now receive automatic email alerts whenever they leave the chat for more than 5 minutes!
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
        ? `Connection verified! A test email has been sent to ${sendTestTo}`
        : 'SMTP connection verified successfully!',
    });
  } catch (error: any) {
    console.error('[SMTP Test Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'SMTP test failed' },
      { status: 500 }
    );
  }
}
