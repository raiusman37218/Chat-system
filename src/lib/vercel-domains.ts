import 'server-only';
import { Vercel } from '@vercel/sdk';

export interface VercelVerificationRecord {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

export interface VercelDomainStatusResult {
  verified: boolean;
  verificationRecords: VercelVerificationRecord[];
}

function getVercelClient() {
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !token.trim()) {
    throw new Error('VERCEL_TOKEN environment variable is missing.');
  }
  if (!projectId || !projectId.trim()) {
    throw new Error('VERCEL_PROJECT_ID environment variable is missing.');
  }

  const vercel = new Vercel({ bearerToken: token });
  return { vercel, projectId, teamId: teamId || undefined };
}

/**
 * Formats Vercel API errors into plain, human-readable error messages.
 * Handles: domain already in use, rate limited, plan domain limit reached.
 */
export function formatVercelError(err: any): string {
  if (!err) return 'Unknown Vercel API error';
  const status = err.statusCode || err.status;
  const message = (err.message || err.body || String(err)).toLowerCase();
  const code = (err.code || err.errorCode || '').toLowerCase();

  if (
    code.includes('already_in_use') ||
    code.includes('already_exists') ||
    code.includes('domain_taken') ||
    message.includes('already in use') ||
    message.includes('already exists') ||
    message.includes('domain is taken')
  ) {
    return 'domain already in use';
  }

  if (
    status === 429 ||
    code.includes('rate_limited') ||
    code.includes('too_many_requests') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'rate limited';
  }

  if (
    code.includes('domain_limit') ||
    code.includes('plan_limit') ||
    message.includes('domain limit') ||
    message.includes('plan limit')
  ) {
    return 'plan domain limit reached';
  }

  if (status === 403 || message.includes('not authorized') || message.includes('invalidtoken')) {
    return 'Vercel API token is invalid or lacks permissions for this project.';
  }

  return err.message || 'Vercel API error';
}

/**
 * addDomain(domain):
 * Calls vercel.projects.addProjectDomain({ idOrName: VERCEL_PROJECT_ID, teamId, requestBody: { name: domain } })
 */
export async function addDomain(domain: string) {
  const { vercel, projectId, teamId } = getVercelClient();
  const clean = domain.trim().toLowerCase();

  try {
    const response = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      teamId,
      requestBody: { name: clean },
    });

    const body = response as any;
    const verified = Boolean(body?.verified);
    const rawVerification = (body?.verification || []) as any[];

    const verificationRecords: VercelVerificationRecord[] = rawVerification.map((v) => ({
      type: v.type || 'TXT',
      domain: v.domain || '',
      value: v.value || '',
      reason: v.reason || 'Domain verification required by Vercel',
    }));

    return {
      success: true,
      verified,
      verificationRecords,
      data: body,
    };
  } catch (err: any) {
    const formattedMessage = formatVercelError(err);
    if (formattedMessage === 'domain already in use') {
      try {
        const status = await getDomainStatus(clean);
        return {
          success: true,
          verified: status.verified,
          verificationRecords: status.verificationRecords,
          alreadyExists: true,
        };
      } catch {
        // Fall back to throw formatted error if getDomainStatus fails
      }
    }
    throw new Error(formattedMessage);
  }
}

/**
 * getDomainStatus(domain):
 * Calls projectsGetProjectDomain + projectsVerifyProjectDomain; returns { verified, verificationRecords }
 */
export async function getDomainStatus(domain: string): Promise<VercelDomainStatusResult> {
  const { vercel, projectId, teamId } = getVercelClient();
  const clean = domain.trim().toLowerCase();

  let verified = false;
  let verificationRecords: VercelVerificationRecord[] = [];

  // 1. Get current project domain info via projectsGetProjectDomain
  try {
    const getRes = (await vercel.projects.getProjectDomain({
      idOrName: projectId,
      domain: clean,
      teamId,
    })) as any;

    if (getRes) {
      verified = Boolean(getRes.verified);
      const rawVerification = (getRes.verification || []) as any[];
      verificationRecords = rawVerification.map((v) => ({
        type: v.type || 'TXT',
        domain: v.domain || '',
        value: v.value || '',
        reason: v.reason || 'Domain verification required by Vercel',
      }));
    }
  } catch (err: any) {
    // Domain may not be retrieved yet or requires verification call
  }

  // 2. Call projectsVerifyProjectDomain to verify domain on Vercel
  if (!verified) {
    try {
      const verifyRes = (await vercel.projects.verifyProjectDomain({
        idOrName: projectId,
        domain: clean,
        teamId,
      })) as any;

      if (verifyRes && verifyRes.verified) {
        verified = true;
      }
    } catch {
      // If verify call errors, verified remains false
    }
  }

  return {
    verified,
    verificationRecords,
  };
}

/**
 * removeDomain(domain):
 * Calls vercel.projects.removeProjectDomain({ idOrName: VERCEL_PROJECT_ID, domain, teamId })
 */
export async function removeDomain(domain: string) {
  const { vercel, projectId, teamId } = getVercelClient();
  const clean = domain.trim().toLowerCase();

  try {
    await vercel.projects.removeProjectDomain({
      idOrName: projectId,
      domain: clean,
      teamId,
    });
    return { success: true };
  } catch (err: any) {
    const status = err?.statusCode || err?.status;
    if (status === 404) {
      return { success: true };
    }
    const formattedMessage = formatVercelError(err);
    throw new Error(formattedMessage);
  }
}
