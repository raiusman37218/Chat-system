import { serviceClient } from '@/lib/supabase/service';
import { Workspace } from '@/types/database';
import { sendSmtpEmail } from './smtp';
import { cleanDomain, getPlatformOrigin, splitDomain, CNAME_TARGET } from '@/lib/domain';

interface DomainLiveEmailParams {
  workspace: Workspace;
  domain: string;
}

interface DomainFailedEmailParams {
  workspace: Workspace;
  domain: string;
  reason: string;
  detectedCname?: string | null;
  isCloudflare?: boolean;
}

/**
 * Finds the email address of the workspace owner.
 */
export async function getWorkspaceOwnerEmail(workspaceId: string, ownerId?: string): Promise<{
  email: string | null;
  name: string | null;
}> {
  const supabase = serviceClient();

  if (ownerId) {
    const { data: owner } = await supabase
      .from('agents')
      .select('email, name')
      .eq('id', ownerId)
      .maybeSingle();

    if (owner?.email) {
      return { email: owner.email, name: owner.name };
    }
  }

  // Fallback to any agent with role 'owner' in this workspace
  const { data: owners } = await supabase
    .from('agents')
    .select('email, name')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .limit(1);

  if (owners && owners.length > 0 && owners[0]?.email) {
    return { email: owners[0].email, name: owners[0].name };
  }

  return { email: null, name: null };
}

/**
 * Sends an email notification when a custom domain goes Live.
 */
export async function sendDomainLiveEmail(params: DomainLiveEmailParams): Promise<{
  success: boolean;
  sentTo?: string;
  error?: string;
}> {
  const { workspace, domain } = params;
  const clean = cleanDomain(domain);
  const helpCenterUrl = `https://${clean}`;
  const brand = workspace.brand_color || '#4f46e5';

  const { email, name } = await getWorkspaceOwnerEmail(workspace.id, workspace.owner_id);
  if (!email) {
    console.warn(`[Domain Email] No owner email found for workspace ${workspace.id}`);
    return { success: false, error: 'No owner email found' };
  }

  const subject = `🎉 Your Help Center is now Live on https://${clean}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 28px 32px 24px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <span style="font-size: 20px; font-weight: 700; color: ${brand};">${workspace.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px;">
                ✓ Domain Verified &amp; SSL Active
              </div>
              <h1 style="margin: 0 0 14px; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Your Help Center is now Live!
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hello <strong>${name || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Great news! Your custom domain <strong>${clean}</strong> has been successfully verified, an SSL certificate has been issued, and your public Help Center is actively serving visitors.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 16px 20px; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Live URL</div>
                <div style="font-size: 16px; font-weight: 600; color: #0f172a;">
                  <a href="${helpCenterUrl}" target="_blank" style="color: ${brand}; text-decoration: none;">${helpCenterUrl}</a>
                </div>
              </div>
              <p style="margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.5;">
                All visitor traffic to your previous platform subdomain now automatically redirects to your custom domain, and all links generated in live chat, bot responses, and widgets are now branded with <strong>${clean}</strong>.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 6px 0 16px;">
                    <a href="${helpCenterUrl}" target="_blank" style="display: inline-block; background-color: ${brand}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                      Visit Your Help Center &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #fafaf9; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Sent by ${workspace.name} automated domain manager.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (workspace.smtp_settings?.enabled) {
    const res = await sendSmtpEmail(workspace.smtp_settings, {
      to: email,
      subject,
      html,
    });
    return { success: res.success, sentTo: email, error: res.error };
  } else {
    console.log(`[Domain Email] SMTP not configured. Live email for ${clean} would be sent to: ${email}`);
    return { success: true, sentTo: email };
  }
}

/**
 * Sends an email notification if a custom domain setup is still failing after 24 hours,
 * providing the exact diagnosis and steps to resolve.
 */
export async function sendDomainFailed24hEmail(params: DomainFailedEmailParams): Promise<{
  success: boolean;
  sentTo?: string;
  error?: string;
}> {
  const { workspace, domain, reason, detectedCname, isCloudflare } = params;
  const clean = cleanDomain(domain);
  const { hostRecord } = splitDomain(clean);
  const brand = workspace.brand_color || '#4f46e5';
  const settingsUrl = `${getPlatformOrigin()}/admin/settings`;

  const { email, name } = await getWorkspaceOwnerEmail(workspace.id, workspace.owner_id);
  if (!email) {
    console.warn(`[Domain Email] No owner email found for workspace ${workspace.id}`);
    return { success: false, error: 'No owner email found' };
  }

  const subject = `⚠️ Action Needed: Help Center domain setup for ${clean}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 28px 32px 24px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <span style="font-size: 20px; font-weight: 700; color: ${brand};">${workspace.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #fef2f2; color: #dc2626; font-size: 13px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px;">
                ⚠️ Action Needed &bull; DNS Setup Pending
              </div>
              <h1 style="margin: 0 0 14px; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Domain verification for ${clean}
              </h1>
              <p style="margin: 0 0 18px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hello <strong>${name || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 18px; font-size: 15px; color: #475569; line-height: 1.6;">
                You connected <strong>${clean}</strong> to your Help Center over 24 hours ago, but our automated checks are still unable to verify your DNS configuration.
              </p>
              
              <!-- Exact Diagnosis Box -->
              <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9f1239; margin-bottom: 6px;">
                  Diagnosis / Reason
                </div>
                <div style="font-size: 14px; color: #881337; line-height: 1.5;">
                  ${reason}
                </div>
                ${
                  detectedCname
                    ? `<div style="font-size: 13px; color: #9f1239; margin-top: 8px;"><strong>Current Target:</strong> ${detectedCname} (expected: ${CNAME_TARGET})</div>`
                    : ''
                }
                ${
                  isCloudflare
                    ? `<div style="font-size: 13px; color: #9f1239; margin-top: 8px;"><strong>Cloudflare Notice:</strong> Ensure Proxy status is set to <strong>DNS only (gray cloud)</strong>. An active orange cloud hides the CNAME record.</div>`
                    : ''
                }
              </div>

              <!-- Required Record -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">
                  Required DNS Record
                </div>
                <table width="100%" border="0" cellspacing="4" cellpadding="0" style="font-size: 13px; color: #334155;">
                  <tr>
                    <td width="30%"><strong>Type:</strong></td>
                    <td><code>CNAME</code></td>
                  </tr>
                  <tr>
                    <td><strong>Name / Host:</strong></td>
                    <td><code>${hostRecord}</code></td>
                  </tr>
                  <tr>
                    <td><strong>Target / Points to:</strong></td>
                    <td><code>${CNAME_TARGET}</code></td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.5;">
                Once you save this record with your DNS provider, our system will automatically verify it and activate your SSL certificate without any manual action required.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 6px 0 16px;">
                    <a href="${settingsUrl}" target="_blank" style="display: inline-block; background-color: ${brand}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                      Open Domain Settings &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #fafaf9; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Sent by ${workspace.name} automated domain manager.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (workspace.smtp_settings?.enabled) {
    const res = await sendSmtpEmail(workspace.smtp_settings, {
      to: email,
      subject,
      html,
    });
    return { success: res.success, sentTo: email, error: res.error };
  } else {
    console.log(`[Domain Email] SMTP not configured. Failed 24h email for ${clean} would be sent to: ${email}`);
    return { success: true, sentTo: email };
  }
}
