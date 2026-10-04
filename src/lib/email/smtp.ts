import nodemailer from 'nodemailer';
import { SMTPSettingsConfig } from '@/types/database';

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getEffectiveFromEmail(config: SMTPSettingsConfig): string {
  const customFrom = (config.from_email || '').trim();
  if (isValidEmail(customFrom)) {
    return customFrom;
  }
  return (config.user || '').trim();
}

export function createSmtpTransporter(config: SMTPSettingsConfig) {
  const isSecure = config.secure !== undefined 
    ? config.secure 
    : (Number(config.port) === 465);

  return nodemailer.createTransport({
    host: config.host.trim(),
    port: Number(config.port),
    secure: isSecure,
    auth: {
      user: config.user.trim(),
      pass: config.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function testSmtpConnection(config: SMTPSettingsConfig): Promise<{ success: boolean; message?: string }> {
  try {
    const transporter = createSmtpTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    console.error('[SMTP Verify Error]:', error);
    let msg = error.message || 'Failed to connect to SMTP server. Please check your credentials.';
    if (msg.includes('EAUTH') || msg.includes('535')) {
      msg = `Authentication failed for ${config.user}. Please verify your email login and password. If using Hostinger or Google, make sure your credentials are valid.`;
    } else if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      msg = `Could not connect to ${config.host}:${config.port}. Please verify the host and port (465 SSL or 587 TLS).`;
    }
    return { 
      success: false, 
      message: msg 
    };
  }
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendSmtpEmail(
  config: SMTPSettingsConfig, 
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createSmtpTransporter(config);
    const effectiveFrom = getEffectiveFromEmail(config);
    const cleanSenderName = (config.from_name || 'Support Desk')
      .replace(/["\r\n\\]/g, '')
      .trim();
    const fromAddress = `"${cleanSenderName}" <${effectiveFrom}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to.trim(),
      replyTo: options.replyTo && isValidEmail(options.replyTo) ? options.replyTo.trim() : effectiveFrom,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      html: options.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Send Error]:', error);
    let errMsg = error.message || 'Failed to send email';
    if (errMsg.includes('553') && errMsg.includes('Sender address rejected')) {
      errMsg = `Sender address rejected. Most email providers (including Hostinger) require the "From" address to match your authenticated login username (${config.user}).`;
    }
    return { success: false, error: errMsg };
  }
}

export interface UnreadEmailTemplateProps {
  visitorName: string;
  workspaceName: string;
  brandColor?: string;
  logoUrl?: string | null;
  messageContent: string;
  ticketId: string;
  chatUrl: string;
}

export function generateUnreadAlertEmailHtml(props: UnreadEmailTemplateProps): string {
  const brand = props.brandColor || '#4f46e5';
  const name = props.visitorName || 'there';
  const workspace = props.workspaceName || 'Support Desk';
  const ticketSnippet = props.ticketId ? `#${props.ticketId.slice(0, 8)}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New reply to your inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 32px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(to bottom, #ffffff, #fafafa);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    ${
                      props.logoUrl
                        ? `<img src="${props.logoUrl}" alt="${workspace}" height="34" style="max-height: 34px; max-width: 140px; display: block; border-radius: 6px; object-fit: contain;" />`
                        : `<span style="font-size: 20px; font-weight: 700; color: ${brand}; letter-spacing: -0.3px;">${workspace}</span>`
                    }
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 600; border-radius: 9999px; border: 1px solid #a7f3d0;">
                      New Message
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 12px; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.35;">
                You have a new unread reply
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.55;">
                Hello <strong>${name}</strong>, our support team has responded to your recent inquiry${ticketSnippet ? ` (Ticket ${ticketSnippet})` : ''}:
              </p>

              <!-- Message Box -->
              <div style="background-color: #f8fafc; border-left: 4px solid ${brand}; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">
                  Message from ${workspace}
                </div>
                <div style="font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">
                  ${props.messageContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
              </div>

              <p style="margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.5;">
                Because you were away from the chat for more than 5 minutes, we wanted to ensure you received this reply without missing anything.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 6px 0 12px;">
                    <a href="${props.chatUrl}" target="_blank" style="display: inline-block; background-color: ${brand}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                      View &amp; Reply in Chat &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 28px; background-color: #fafaf9; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8;">
                Powered by ${workspace} Live Support
              </p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                If you have already replied or seen this message in chat, please feel free to disregard this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
