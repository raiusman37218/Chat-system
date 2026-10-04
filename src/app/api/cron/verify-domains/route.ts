import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { Workspace } from '@/types/database';
import { cleanDomain, CNAME_TARGET, splitDomain } from '@/lib/domain';
import { addDomainToProject, getVercelDomainStatus, verifyVercelDomain } from '@/lib/vercel';
import { detectDnsProvider } from '@/lib/dns-provider';
import { sendDomainLiveEmail, sendDomainFailed24hEmail } from '@/lib/email/domain-notifications';
import dns, { Resolver } from 'node:dns/promises';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for cron

async function resolveCnameSafe(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveCname(domain);
    if (records && records.length > 0) return records;
  } catch {}
  try {
    const resolver = new Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']);
    return await resolver.resolveCname(domain);
  } catch {
    return [];
  }
}

function isHostingTarget(target: string): boolean {
  const t = target.toLowerCase();
  return (
    /\.vercel-dns(-\d+)?\.com$/.test(t) ||
    t.endsWith('.vercel.app') ||
    t.endsWith('.vercel-dns.com') ||
    t.includes('zentry') ||
    t.includes('chatify')
  );
}

export async function GET(request: Request) {
  return handleDomainVerificationCron(request);
}

export async function POST(request: Request) {
  return handleDomainVerificationCron(request);
}

async function handleDomainVerificationCron(request: Request) {
  const supabase = serviceClient();
  const now = new Date();

  // 1. Fetch all workspaces with pending custom domains
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .not('custom_domain', 'is', null)
    .eq('custom_domain_status', 'pending');

  if (error || !workspaces) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pending domains' },
      { status: 500 }
    );
  }

  const results = {
    totalPending: workspaces.length,
    checked: 0,
    verified: 0,
    stillPending: 0,
    notificationsSent: 0,
  };

  for (const ws of workspaces as Workspace[]) {
    if (!ws.custom_domain) continue;

    const domain = cleanDomain(ws.custom_domain);
    const connectedAt = ws.custom_domain_connected_at ? new Date(ws.custom_domain_connected_at) : now;
    const lastCheckedAt = ws.custom_domain_last_checked_at ? new Date(ws.custom_domain_last_checked_at) : null;

    const elapsedMinutes = (now.getTime() - connectedAt.getTime()) / (1000 * 60);
    const minutesSinceLastCheck = lastCheckedAt
      ? (now.getTime() - lastCheckedAt.getTime()) / (1000 * 60)
      : Infinity;

    // Polling schedule rule:
    // - Within first 30 minutes: poll every cycle (~30 seconds)
    // - After 30 minutes: poll hourly (~60 minutes)
    // - Force check if url param ?force=1 is passed
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('workspaceId') === ws.id;

    const shouldCheck =
      force ||
      (elapsedMinutes <= 30 && minutesSinceLastCheck >= 0.4) ||
      (elapsedMinutes > 30 && minutesSinceLastCheck >= 55);

    if (!shouldCheck) {
      continue;
    }

    results.checked++;

    try {
      // 1. Check DNS CNAME resolution
      const cnameRecords = await resolveCnameSafe(domain);
      const expected = CNAME_TARGET.toLowerCase().replace(/\.$/, '');
      const cnameMatches = cnameRecords.some((target) => {
        const t = target.toLowerCase().replace(/\.$/, '');
        return t === expected || isHostingTarget(t);
      });

      // 2. Check Vercel project status & SSL
      const [vercelStatus, vercelVerify] = await Promise.all([
        getVercelDomainStatus(domain),
        verifyVercelDomain(domain),
      ]);

      const isLive = cnameMatches || vercelStatus.verified || vercelVerify.verified;

      if (isLive) {
        // Domain is now LIVE!
        const verifiedAt = now.toISOString();
        await supabase
          .from('workspaces')
          .update({
            custom_domain_status: 'verified',
            custom_domain_verified_at: verifiedAt,
            custom_domain_last_checked_at: verifiedAt,
            custom_domain_notification_sent: 'live',
          })
          .eq('id', ws.id);

        // Ensure attached on Vercel for SSL certificate issuance
        await addDomainToProject(domain);

        // Send celebratory Live email to workspace owner
        if (ws.custom_domain_notification_sent !== 'live') {
          await sendDomainLiveEmail({ workspace: ws, domain });
          results.notificationsSent++;
        }

        results.verified++;
      } else {
        // Still pending
        results.stillPending++;
        await supabase
          .from('workspaces')
          .update({
            custom_domain_last_checked_at: now.toISOString(),
          })
          .eq('id', ws.id);

        // If >= 24 hours and failure email has not been sent yet
        const isPast24Hours = elapsedMinutes >= 1440; // 24 * 60 minutes
        const failureEmailSent = ws.custom_domain_notification_sent === 'failed_24h';

        if (isPast24Hours && !failureEmailSent) {
          const providerGuide = await detectDnsProvider(domain);
          const foundCname = cnameRecords[0] || null;

          let diagnosisReason = '';
          if (cnameRecords.length === 0) {
            diagnosisReason = `No CNAME record was found for ${domain}. Please add a CNAME record with host "${splitDomain(domain).hostRecord}" pointing to "${CNAME_TARGET}".`;
          } else if (foundCname) {
            diagnosisReason = `Your domain currently points to "${foundCname}" instead of "${CNAME_TARGET}".`;
          } else {
            diagnosisReason = `DNS records could not be verified by Vercel. Please confirm the CNAME record is saved in your DNS manager.`;
          }

          if (providerGuide.isCloudflare) {
            diagnosisReason += ' Cloudflare proxy (orange cloud) appears to be active; please switch to "DNS only" (gray cloud).';
          }

          await sendDomainFailed24hEmail({
            workspace: ws,
            domain,
            reason: diagnosisReason,
            detectedCname: foundCname,
            isCloudflare: providerGuide.isCloudflare,
          });

          await supabase
            .from('workspaces')
            .update({
              custom_domain_notification_sent: 'failed_24h',
            })
            .eq('id', ws.id);

          results.notificationsSent++;
        }
      }
    } catch (err: any) {
      console.error(`[Cron Verify] Error checking domain ${domain}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    results,
  });
}
