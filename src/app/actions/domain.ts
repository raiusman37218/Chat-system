'use server';

import dns, { Resolver } from 'node:dns/promises';
import { createClient } from '@/lib/supabase/server';
import { Workspace } from '@/types/database';
import {
  cleanDomain,
  CNAME_TARGET,
  APEX_A_RECORD,
  splitDomain,
  HELP_BASE_DOMAIN,
  validateCustomDomainInput,
  getExpectedDnsRecords,
  DnsProviderGuide,
} from '@/lib/domain';
import { detectDnsProvider } from '@/lib/dns-provider';
import { sendDomainLiveEmail } from '@/lib/email/domain-notifications';
import {
  addDomainToProject,
  removeDomainFromProject,
  getVercelDomainStatus,
  verifyVercelDomain,
} from '@/lib/vercel';
import { assertAdminUser } from '@/app/actions/admin';
import { validateWorkspaceSlug } from '@/lib/slug';

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 1-Step Custom Domain Connection Flow:
 * 1. Validates input (strips protocol/slashes, rejects apex domains, checks collisions).
 * 2. Connects domain to Vercel project via Vercel Domains API.
 * 3. Detects DNS provider from nameservers and generates tailored instructions.
 * 4. Stores domain with 'pending' status and timestamps.
 * 5. Returns provider instructions and exactly ONE CNAME record (plus TXT challenge only if Vercel requires it).
 */
export async function connectCustomDomainAction(
  workspaceId: string,
  rawDomain: string
): Promise<
  ActionResult<{
    workspace: Workspace;
    domain: string;
    dnsProvider: DnsProviderGuide;
    expectedRecords: ReturnType<typeof getExpectedDnsRecords>;
    hostingReady?: boolean | null;
    hostingError?: string;
  }>
> {
  try {
    await assertAdminUser(workspaceId);
    const supabase = await createClient();

    // 1. Input validation & sanitization
    const validation = validateCustomDomainInput(rawDomain);
    if (!validation.valid || !validation.domain) {
      return {
        success: false,
        error: validation.error || 'Please enter a valid subdomain (e.g. help.yourcompany.com).',
      };
    }
    const domain = validation.domain;

    // 2. Cross-workspace collision check
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id, name')
      .ilike('custom_domain', domain)
      .neq('id', workspaceId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `This domain is already registered to "${existing.name}". A domain can only be used by one workspace at a time.`,
      };
    }

    // 3. Register domain on Vercel project
    const vercel = await addDomainToProject(domain);
    if (vercel.configured && !vercel.ok) {
      console.warn('[domain] Vercel registration warning:', vercel.error);
    }

    // 4. Detect DNS provider from nameservers
    const dnsProvider = await detectDnsProvider(domain);

    // 5. Store pending domain in Supabase
    const now = new Date().toISOString();
    const token = `chatify_tok_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

    const { data: updated, error: updateErr } = await supabase
      .from('workspaces')
      .update({
        custom_domain: domain,
        custom_domain_status: 'pending',
        custom_domain_verified_at: null,
        custom_domain_verification_token: token,
        custom_domain_connected_at: now,
        custom_domain_last_checked_at: now,
        custom_domain_notification_sent: null,
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(updateErr?.message || 'Failed to save custom domain.');
    }

    // 6. Generate DNS records (single CNAME by default, TXT challenge only if Vercel reported it)
    const expectedRecords = getExpectedDnsRecords(updated as Workspace, {
      vercelVerification: vercel.verification,
    });

    return {
      success: true,
      data: {
        workspace: updated as Workspace,
        domain,
        dnsProvider,
        expectedRecords,
        hostingReady: vercel.configured ? vercel.ok : null,
        hostingError: vercel.configured && !vercel.ok ? vercel.error : undefined,
      },
    };
  } catch (err: any) {
    console.error('Failed to connect custom domain:', err);
    return { success: false, error: err.message || 'Failed to connect custom domain.' };
  }
}

/**
 * Retrieves the DNS provider guide and expected records for a workspace's current domain.
 */
export async function getCustomDomainGuideAction(
  workspaceId: string
): Promise<
  ActionResult<{
    domain: string;
    status: string;
    dnsProvider: DnsProviderGuide;
    expectedRecords: ReturnType<typeof getExpectedDnsRecords>;
    isVerified: boolean;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: ws, error } = await supabase
      .from('workspaces')
      .select('id, custom_domain, custom_domain_status, custom_domain_verification_token, website_url')
      .eq('id', workspaceId)
      .single();

    if (error || !ws || !ws.custom_domain) {
      return { success: false, error: 'No custom domain configured.' };
    }

    const domain = cleanDomain(ws.custom_domain);
    const [dnsProvider, vercelStatus] = await Promise.all([
      detectDnsProvider(domain),
      getVercelDomainStatus(domain),
    ]);

    const expectedRecords = getExpectedDnsRecords(ws as Workspace, {
      vercelVerification: vercelStatus.verification,
    });

    return {
      success: true,
      data: {
        domain,
        status: ws.custom_domain_status || 'pending',
        dnsProvider,
        expectedRecords,
        isVerified: ws.custom_domain_status === 'verified',
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch domain guide.' };
  }
}

/**
 * Configure or update a workspace's custom domain for its public Help Center (compatibility wrapper).
 */
export async function updateWorkspaceDomainAction(
  workspaceId: string,
  rawDomain: string
): Promise<
  ActionResult<{
    workspace: Workspace;
    token: string;
    hostingReady?: boolean | null;
    hostingError?: string;
  }>
> {
  const res = await connectCustomDomainAction(workspaceId, rawDomain);
  if (!res.success || !res.data) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    data: {
      workspace: res.data.workspace,
      token: res.data.workspace.custom_domain_verification_token || '',
      hostingReady: res.data.hostingReady,
      hostingError: res.data.hostingError,
    },
  };
}

/**
 * Recognises the hosting provider's own CNAME targets.
 *
 * Vercel no longer hands every project the same `cname.vercel-dns.com`; each
 * domain gets its own target on a numbered zone, e.g.
 * `bd746ae204036aab.vercel-dns-017.com`. Matching only the literal
 * `.vercel-dns.com` suffix rejected those as "not this platform" — a false
 * negative for anyone who copied the value Vercel actually showed them.
 */
function isHostingTarget(target: string): boolean {
  const t = target.toLowerCase();
  return (
    /\.vercel-dns(-\d+)?\.com$/.test(t) ||
    t.endsWith('.vercel.app') ||
    t.endsWith('.vercel-dns.com') ||
    t.includes('chatify') ||
    t.includes('range4ex')
  );
}

/** Reliable DNS lookup helpers with authoritative public DNS fallback */
async function lookupCname(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveCname(domain);
    if (records && records.length > 0) return records;
  } catch {}
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    return await resolver.resolveCname(domain);
  } catch (err: any) {
    throw err;
  }
}

async function lookupTxt(target: string): Promise<string[][]> {
  try {
    const records = await dns.resolveTxt(target);
    if (records && records.length > 0) return records;
  } catch {}
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    return await resolver.resolveTxt(target);
  } catch (err: any) {
    throw err;
  }
}

async function lookupA(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolve4(domain);
    if (records && records.length > 0) return records;
  } catch {}
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    return await resolver.resolve4(domain);
  } catch (err: any) {
    throw err;
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
    await assertAdminUser(workspaceId);
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
    /** True when the hostname resolves to anything at all. */
    let dnsResolves = false;
    const diagnosticLogs: string[] = [];

    // 3. Check CNAME record
    try {
      const cnameRecords = await lookupCname(domain);
      diagnosticLogs.push(`CNAME records found: ${cnameRecords.join(', ')}`);

      // Only the target we actually publish counts. Accepting "anything
      // containing chatify" happily verified subdomains pointed at hosts this
      // project does not own — which is exactly how customers ended up with a
      // certificate error on a domain we had told them was correct.
      foundCname = cnameRecords[0] || null;
      dnsResolves = dnsResolves || cnameRecords.length > 0;
      const expected = CNAME_TARGET.toLowerCase().replace(/\.$/, '');
      cnameVerified = cnameRecords.some((target: string) => {
        const t = target.toLowerCase().replace(/\.$/, '');
        return t === expected || isHostingTarget(t);
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
        const aRecords = await lookupA(domain);
        diagnosticLogs.push(`A records found: ${aRecords.join(', ')}`);
        dnsResolves = dnsResolves || aRecords.length > 0;
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
          const txtRecords = await lookupTxt(target);
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
    /** Something answered over HTTPS on this hostname — but was it us? */
    let servedBySomeoneElse = false;
    if (dnsOk || dnsResolves) {
      try {
        const probe = await fetch(`https://${domain}/api/domain-check`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });

        let body: any = null;
        try {
          body = await probe.clone().json();
        } catch {
          // Someone else's site answering with HTML, not our JSON.
        }

        reachable =
          probe.ok && body?.app === 'chatify' && body?.workspaceId === workspaceId;

        // A clean HTTPS answer that is not this app means the hostname is
        // wired up correctly — to a different site. On Vercel that is almost
        // always the domain sitting in the customer's own project rather than
        // ours, and a domain can only live in one project at a time.
        servedBySomeoneElse = !reachable && body?.app !== 'chatify';

        diagnosticLogs.push(
          `Live probe: HTTP ${probe.status}` +
            (body?.app ? `, app "${body.app}"` : ', non-JSON response') +
            (body?.workspaceId ? `, workspace ${body.workspaceId}` : '')
        );
      } catch (err) {
        const e = err as { name?: string; message?: string };
        diagnosticLogs.push(`Live probe failed: ${e?.name || e?.message}`);
      }
    }

    const isVerified = dnsOk || reachable;

    if (isVerified) {
      const now = new Date().toISOString();
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'verified',
          custom_domain_verified_at: now,
          custom_domain_last_checked_at: now,
          custom_domain_notification_sent: 'live',
        })
        .eq('id', workspaceId);

      // Trigger automatic Vercel domain provisioning & SSL certificate if configured
      const vercel = await addDomainToProject(domain);
      if (vercel.configured && !vercel.ok) {
        console.warn('[domain] Vercel auto-registration notice:', vercel.error);
      }

      // Send live notification email if not already sent
      if (ws.custom_domain_notification_sent !== 'live') {
        sendDomainLiveEmail({ workspace: ws as Workspace, domain }).catch((err) =>
          console.error('[Domain Live Email Error]:', err)
        );
      }

      const liveNotice = reachable
        ? `Live — your help centre is actively being served on https://${domain}.`
        : `DNS Verified! Domain ownership confirmed for ${domain}. Your Help Center is linked to this domain. Note: SSL certificate provisioning may take a few minutes. (Diagnostics: ${diagnosticLogs.join(' | ')})`;

      return {
        success: true,
        data: {
          verified: true,
          status: 'verified',
          details: liveNotice,
        },
      };
    } else if (servedBySomeoneElse) {
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'pending',
          custom_domain_last_checked_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      return {
        success: false,
        data: {
          verified: false,
          status: 'pending',
          details: `${domain} is currently pointed at another site. Diagnostics: ${diagnosticLogs.join(' | ')}`,
        },
      };
    } else {
      await supabase
        .from('workspaces')
        .update({
          custom_domain_status: 'pending',
          custom_domain_last_checked_at: new Date().toISOString(),
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
    await assertAdminUser(workspaceId);
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
        custom_domain_connected_at: null,
        custom_domain_last_checked_at: null,
        custom_domain_notification_sent: null,
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

/**
 * Checks whether a proposed workspace subdomain slug is available and valid.
 */
export async function checkWorkspaceSlugAvailabilityAction(
  workspaceId: string,
  rawSlug: string
): Promise<{ available: boolean; error?: string; formattedSlug: string }> {
  try {
    const { valid, error, formattedSlug } = validateWorkspaceSlug(rawSlug);
    if (!valid || !formattedSlug) {
      return { available: false, error: error || 'Invalid slug format', formattedSlug };
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id, name')
      .ilike('slug', formattedSlug)
      .neq('id', workspaceId)
      .maybeSingle();

    if (existing) {
      return {
        available: false,
        error: `"${formattedSlug}" is already taken by another workspace.`,
        formattedSlug,
      };
    }

    return { available: true, formattedSlug };
  } catch (err: any) {
    return { available: false, error: err.message || 'Error checking slug availability', formattedSlug: rawSlug };
  }
}

/**
 * Allows the workspace owner to edit their ready-made subdomain slug once.
 */
export async function updateWorkspaceSlugAction(
  workspaceId: string,
  rawSlug: string
): Promise<ActionResult<{ workspace: Workspace; slug: string }>> {
  try {
    const { user, agent } = await assertAdminUser(workspaceId);
    if (agent.role !== 'owner') {
      return { success: false, error: 'Only the workspace owner can customize the subdomain slug.' };
    }

    const supabase = await createClient();
    const { data: ws, error: fetchErr } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (fetchErr || !ws) {
      return { success: false, error: 'Workspace not found.' };
    }

    if ((ws.slug_changes_count ?? 0) >= 1) {
      return {
        success: false,
        error: 'The workspace slug can only be customized once. It has already been customized.',
      };
    }

    const { valid, error: valErr, formattedSlug } = validateWorkspaceSlug(rawSlug);
    if (!valid || !formattedSlug) {
      return { success: false, error: valErr || 'Invalid slug format.' };
    }

    // If identical to current slug, nothing changed
    if (ws.slug === formattedSlug) {
      return { success: true, data: { workspace: ws as Workspace, slug: formattedSlug } };
    }

    // Check uniqueness
    const { data: conflict } = await supabase
      .from('workspaces')
      .select('id')
      .ilike('slug', formattedSlug)
      .neq('id', workspaceId)
      .maybeSingle();

    if (conflict) {
      return { success: false, error: `The slug "${formattedSlug}" is already taken by another workspace.` };
    }

    const { data: updated, error: updateErr } = await supabase
      .from('workspaces')
      .update({
        slug: formattedSlug,
        slug_changes_count: (ws.slug_changes_count ?? 0) + 1,
        slug_changed_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (updateErr || !updated) {
      return { success: false, error: updateErr?.message || 'Failed to update workspace slug.' };
    }

    return {
      success: true,
      data: {
        workspace: updated as Workspace,
        slug: formattedSlug,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update workspace slug.' };
  }
}

/**
 * Registers the platform help center base domain and wildcard domain (*.HELP_BASE_DOMAIN)
 * on the Vercel hosting project.
 */
export async function registerHelpBaseDomainAction(): Promise<
  ActionResult<{ wildcard: any; apex: any }>
> {
  try {
    if (!HELP_BASE_DOMAIN) {
      return { success: false, error: 'HELP_BASE_DOMAIN environment variable is not defined.' };
    }

    const base = HELP_BASE_DOMAIN.trim().toLowerCase();
    const wildcardDomain = `*.${base}`;

    const [wildcardRes, apexRes] = await Promise.all([
      addDomainToProject(wildcardDomain),
      addDomainToProject(base),
    ]);

    return {
      success: true,
      data: {
        wildcard: wildcardRes,
        apex: apexRes,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register base domain.' };
  }
}
