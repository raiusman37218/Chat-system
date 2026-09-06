'use server';

import dns from 'node:dns/promises';
import { createClient } from '@/lib/supabase/server';
import { Workspace } from '@/types/database';
import { cleanDomain, CNAME_TARGET, APEX_A_RECORD, splitDomain } from '@/lib/domain';
import { addDomainToProject, removeDomainFromProject } from '@/lib/vercel';

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Configure or update a workspace's custom domain for its public Help Center.
 */
export async function updateWorkspaceDomainAction(
  workspaceId: string,
  rawDomain: string
): Promise<
  ActionResult<{
    workspace: Workspace;
    token: string;
    /** null when the platform has no Vercel credentials configured. */
    hostingReady?: boolean | null;
    hostingError?: string;
  }>
> {
  try {
    const supabase = await createClient();

    const domain = cleanDomain(rawDomain);
    if (!domain) {
      return { success: false, error: 'Please provide a valid domain (e.g. support.mycompany.com)' };
    }

    // Check if domain is already claimed by another workspace
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id, name')
      .ilike('custom_domain', domain)
      .neq('id', workspaceId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `This domain is already registered to "${existing.name}".` };
    }

    // Generate or preserve token
    const verificationToken = `chatify_tok_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

    const { data: updated, error } = await supabase
      .from('workspaces')
      .update({
        custom_domain: domain,
        custom_domain_status: 'pending',
        custom_domain_verified_at: null,
        custom_domain_verification_token: verificationToken,
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Attach the hostname to the hosting project straight away. Without this
    // Vercel has no certificate for it, and the customer sees a TLS warning
    // even with perfect DNS. Failing here is not fatal: DNS still has to
    // propagate, and verification will report what is still missing.
    const vercel = await addDomainToProject(domain);
    if (vercel.configured && !vercel.ok) {
      console.warn('[domain] Vercel registration failed:', vercel.error);
    }

    return {
      success: true,
      data: {
        workspace: updated as Workspace,
        token: verificationToken,
        hostingReady: vercel.configured ? vercel.ok : null,
        hostingError: vercel.configured && !vercel.ok ? vercel.error : undefined,
      },
    };
  } catch (err: any) {
    console.error('Failed to update workspace domain:', err);
    return { success: false, error: err.message || 'Failed to update domain' };
  }
}

/**
 * Perform live DNS verification check (TXT record or CNAME record) for a workspace.
 */
export async function verifyWorkspaceDomainAction(
  workspaceId: string
): Promise<
  ActionResult<{
    verified: boolean;
    /** `pending` means DNS is right but the domain is not serving us yet. */
    status: 'verified' | 'pending' | 'failed';
    details: string;
  }>
> {
  try {
    const supabase = await createClient();

    // 1. Fetch workspace
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !ws) {
      return { success: false, error: 'Workspace not found' };
    }

    const domain = cleanDomain(ws.custom_domain);
    if (!domain) {
      return { success: false, error: 'No custom domain configured for this workspace' };
    }

    const token = ws.custom_domain_verification_token;

    // Re-attach on every verify, not only when the domain is first saved.
    // Workspaces whose domain was stored before the hosting credentials
    // existed were never registered, and there was no way to fix them from the
    // UI short of removing and re-adding the domain. Attaching here is
    // idempotent, so pressing Verify repairs them.
    const hosting = await addDomainToProject(domain);
    if (hosting.configured && !hosting.ok) {
      console.warn('[domain] Vercel registration failed:', hosting.error);
    }

    // 2. Allow test domains / local simulated domains for development
    // Local development shortcuts only. `.chatify.dev` used to be in here and
    // auto-verified with no checks at all, on a domain this project does not
    // own — a real domain must always earn its "verified".
    const isTestDomain =
      domain.includes('localhost') ||
      domain.endsWith('.test') ||
      domain.endsWith('.local');

    if (isTestDomain) {
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'verified',
          custom_domain_verified_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      return {
        success: true,
        data: {
          verified: true,
          status: 'verified',
          details: 'Local/test domain verified successfully!',
        },
      };
    }

    let cnameVerified = false;
    let txtVerified = false;
    let foundCname: string | null = null;
    const diagnosticLogs: string[] = [];

    // 3. Check CNAME record
    try {
      const cnameRecords = await dns.resolveCname(domain);
      diagnosticLogs.push(`CNAME records found: ${cnameRecords.join(', ')}`);

      // Only the target we actually publish counts. Accepting "anything
      // containing chatify" happily verified subdomains pointed at hosts this
      // project does not own — which is exactly how customers ended up with a
      // certificate error on a domain we had told them was correct.
      foundCname = cnameRecords[0] || null;
      const expected = CNAME_TARGET.toLowerCase().replace(/.$/, '');
      cnameVerified = cnameRecords.some((target) => {
        const t = target.toLowerCase().replace(/.$/, '');
        return t === expected || t.endsWith('.vercel-dns.com') || t.endsWith('.vercel.app');
      });
    } catch (err: any) {
      diagnosticLogs.push(`CNAME lookup: ${err.code || err.message}`);
    }

    // 3b. An apex domain cannot carry a CNAME, so it points at us with an A
    // record instead. Without this branch every workspace on a bare domain
    // fell through to the TXT path and, if they had not added a TXT record,
    // was told its DNS was missing while it was in fact correct.
    if (!cnameVerified && splitDomain(domain).isApex) {
      try {
        const aRecords = await dns.resolve4(domain);
        diagnosticLogs.push(`A records found: ${aRecords.join(', ')}`);
        if (aRecords.includes(APEX_A_RECORD)) {
          cnameVerified = true;
        } else {
          foundCname = foundCname || aRecords[0] || null;
        }
      } catch (err: any) {
        diagnosticLogs.push(`A lookup: ${err.code || err.message}`);
      }
    }

    // 4. Check TXT record on domain and on _chatify-challenge.{domain}
    if (!cnameVerified && token) {
      const txtTargets = [`_chatify-challenge.${domain}`, domain];

      for (const target of txtTargets) {
        try {
          const txtRecords = await dns.resolveTxt(target);
          const flatTxt = txtRecords.flat().join(' ');
          diagnosticLogs.push(`TXT on ${target}: "${flatTxt}"`);

          if (flatTxt.includes(token) || flatTxt.includes('chatify-site-verification=')) {
            txtVerified = true;
            break;
          }
        } catch (err: any) {
          diagnosticLogs.push(`TXT on ${target}: ${err.code || err.message}`);
        }
      }
    }

    const dnsOk = cnameVerified || txtVerified;

    // DNS is necessary but not sufficient. On Vercel (and most hosts) the
    // domain must also be attached to the project, or the edge answers with
    // its own 404 and this app never sees the request. Marking "verified" off
    // DNS alone told owners their help centre was live when visitors were
    // getting a 404, so the last word belongs to a real request.
    let reachable = false;
    if (dnsOk) {
      try {
        const probe = await fetch(`https://${domain}/api/domain-check`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (probe.ok) {
          const body = await probe.json();
          reachable = body?.app === 'chatify' && body?.workspaceId === workspaceId;
          diagnosticLogs.push(
            `Live probe: HTTP ${probe.status}, resolved workspace ${body?.workspaceId ?? 'none'}`
          );
        } else {
          diagnosticLogs.push(`Live probe: HTTP ${probe.status}`);
        }
      } catch (err) {
        const e = err as { name?: string; message?: string };
        diagnosticLogs.push(`Live probe failed: ${e?.name || e?.message}`);
      }
    }

    const isVerified = dnsOk && reachable;

    if (isVerified) {
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'verified',
          custom_domain_verified_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      return {
        success: true,
        data: {
          verified: true,
          status: 'verified',
          details: 'Live — your help centre is being served on this domain.',
        },
      };
    } else if (dnsOk) {
      // The most common real-world state: DNS is right, but nobody added the
      // domain to the hosting project yet. Say exactly that.
      await supabase
        .from('workspaces')
        .update({ custom_domain_status: 'pending' })
        .eq('id', workspaceId);

      return {
        success: false,
        data: {
          verified: false,
          status: 'pending',
          details: !hosting.configured
            ? `DNS looks correct, but ${domain} is not serving your help centre yet. ` +
              `This platform has no hosting credentials configured, so the domain ` +
              `must be added to the hosting project by hand (Vercel → Project → ` +
              `Settings → Domains). Diagnostics: ${diagnosticLogs.join(' | ')}`
            : hosting.ok
            ? `DNS and hosting are both set up — the certificate for ${domain} is ` +
              `still being issued. This usually takes a minute or two; verify again ` +
              `shortly. Diagnostics: ${diagnosticLogs.join(' | ')}`
            : `DNS looks correct, but registering ${domain} with the hosting ` +
              `project failed: ${hosting.error}. Diagnostics: ${diagnosticLogs.join(' | ')}`,
        },
      };
    } else {
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'failed',
        })
        .eq('id', workspaceId);

      return {
        success: false,
        data: {
          verified: false,
          status: 'failed',
          // Naming the wrong target beats "not detected yet". Every workspace
          // set up before the CNAME target was corrected is pointing at the
          // old value, and without this they have no way to know that.
          details: (() => {
            const { isApex } = splitDomain(domain);
            const record = isApex
              ? `an A record pointing to ${APEX_A_RECORD}`
              : `a CNAME pointing to "${CNAME_TARGET}"`;
            const diag = `Diagnostics: ${diagnosticLogs.join(' | ')}`;
            return foundCname
              ? `${domain} currently points at "${foundCname}", which is not this ` +
                `platform. Replace it with ${record} and verify again. ${diag}`
              : `No DNS records found for ${domain} yet. Add ${record}. Changes ` +
                `can take a few minutes to propagate. ${diag}`;
          })(),
        },
      };
    }
  } catch (err: any) {
    console.error('DNS verification error:', err);
    return { success: false, error: err.message || 'Verification process failed' };
  }
}

/**
 * Reset / remove custom domain configuration.
 */
export async function removeWorkspaceDomainAction(
  workspaceId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Read it before clearing, so the hostname can be released upstream too.
    const { data: ws } = await supabase
      .from('workspaces')
      .select('custom_domain')
      .eq('id', workspaceId)
      .maybeSingle();

    const { error } = await supabase
      .from('workspaces')
      .update({
        custom_domain: null,
        custom_domain_status: null,
        custom_domain_verified_at: null,
        custom_domain_verification_token: null,
      })
      .eq('id', workspaceId);

    if (error) throw new Error(error.message);

    // Leaving it attached would block the same domain from being added to
    // another workspace later.
    if (ws?.custom_domain) {
      await removeDomainFromProject(ws.custom_domain);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove domain' };
  }
}
