'use server';

import dns from 'node:dns/promises';
import { createClient } from '@/lib/supabase/server';
import { Workspace } from '@/types/database';
import { cleanDomain } from '@/lib/domain';

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
): Promise<ActionResult<{ workspace: Workspace; token: string }>> {
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

    return {
      success: true,
      data: {
        workspace: updated as Workspace,
        token: verificationToken,
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
): Promise<ActionResult<{ verified: boolean; status: 'verified' | 'failed'; details: string }>> {
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

    // 2. Allow test domains / local simulated domains for development
    const isTestDomain =
      domain.includes('localhost') ||
      domain.endsWith('.test') ||
      domain.endsWith('.local') ||
      domain.endsWith('.chatify.dev') ||
      domain.startsWith('demo-');

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
    const diagnosticLogs: string[] = [];

    // 3. Check CNAME record
    try {
      const cnameRecords = await dns.resolveCname(domain);
      diagnosticLogs.push(`CNAME records found: ${cnameRecords.join(', ')}`);

      // Match cname.chatify.dev, vercel.app, or platform target
      cnameVerified = cnameRecords.some(
        (target) =>
          target.toLowerCase().includes('chatify') ||
          target.toLowerCase().includes('vercel')
      );
    } catch (err: any) {
      diagnosticLogs.push(`CNAME lookup: ${err.code || err.message}`);
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

    const isVerified = cnameVerified || txtVerified;

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
          details: cnameVerified
            ? 'CNAME routing verified and active!'
            : 'TXT ownership challenge successfully verified!',
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
          details: `DNS records not detected yet. Diagnostics: ${diagnosticLogs.join(' | ')}`,
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

    const { error } = await supabase
      .from('workspaces')
      .update({
        custom_domain: null,
        custom_domain_status: null,
        custom_domain_verified_at: null,
      })
      .eq('id', workspaceId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove domain' };
  }
}
