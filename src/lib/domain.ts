import { Workspace } from '@/types/database';

/**
 * Normalizes any website URL or hostname into a clean root domain or host.
 * E.g.: "https://www.apexshoes.com/store" -> "apexshoes.com"
 *       "http://localhost:3000/demo.html" -> "localhost:3000"
 *       "support.mybrand.com" -> "support.mybrand.com"
 */
export function cleanDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return '';
  let str = urlOrDomain.trim().toLowerCase();

  // Strip protocol
  str = str.replace(/^https?:\/\//, '');

  // Strip trailing path/query/hashes
  str = str.split('/')[0].split('?')[0].split('#')[0];

  // Strip leading www. if present (preserve subdomains like support. or help.)
  if (str.startsWith('www.')) {
    str = str.slice(4);
  }

  return str;
}

/**
 * Computes the recommended help center subdomain from a website URL.
 * E.g.: "https://apexshoes.com" -> "help.apexshoes.com"
 *       "http://localhost:3000/demo.html" -> "help.localhost"
 */
export function getDefaultSubdomain(websiteUrl: string | null | undefined, prefix = 'help'): string {
  const domain = cleanDomain(websiteUrl);
  if (!domain) return '';

  // If already prefixed with help/support, return as is
  if (domain.startsWith('help.') || domain.startsWith('support.') || domain.startsWith('kb.')) {
    return domain;
  }

  // If localhost, strip port for clean display
  if (domain.startsWith('localhost')) {
    return `${prefix}.localhost`;
  }

  return `${prefix}.${domain}`;
}

/**
 * Resolves the platform root origin.
 */
export function getPlatformOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Returns the public Help Center URL scoped specifically to this workspace.
 *
 * Rules:
 * 1. If the workspace has a verified custom domain (e.g. support.mycompany.com),
 *    the helpdesk is served directly from that domain: https://support.mycompany.com
 * 2. If no custom domain is verified yet, it falls back to a workspace-specific path
 *    under our platform (e.g. https://platform.com/help/apex-shoes or /help/{workspaceId}).
 * 3. Never hardcodes or falls back to an un-scoped generic shared URL.
 */
export function getWorkspaceHelpCenterUrl(
  workspace: Workspace | null | undefined,
  article?: { id: string; slug?: string | null } | null
): string {
  if (!workspace) {
    return `${getPlatformOrigin()}/help`;
  }

  const articlePath = article ? `/${article.slug || article.id}` : '';

  // 1. Verified custom domain mode
  if (workspace.custom_domain && workspace.custom_domain_status === 'verified') {
    const domain = cleanDomain(workspace.custom_domain);
    return `https://${domain}${articlePath}`;
  }

  // 2. Client-side check: if the page is currently being viewed through a custom domain
  if (typeof window !== 'undefined') {
    const host = window.location.host.toLowerCase().split(':')[0];
    const isPlatform =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('chatify.dev') ||
      host.endsWith('chatify.site');

    if (!isPlatform && workspace.custom_domain && cleanDomain(workspace.custom_domain) === host) {
      return `https://${host}${articlePath}`;
    }
  }

  // 3. Workspace-scoped fallback under platform
  const identifier = workspace.slug || workspace.id;
  return `${getPlatformOrigin()}/help/${identifier}${articlePath}`;
}

/**
 * Returns the canonical display domain and configuration info for a workspace.
 */
export function getWorkspaceDomainInfo(workspace: Workspace | null | undefined) {
  if (!workspace) {
    return {
      targetDomain: '',
      isVerified: false,
      isCustom: false,
      status: 'pending' as const,
      verificationToken: '',
      publicUrl: getPlatformOrigin(),
    };
  }

  const websiteDomain = cleanDomain(workspace.website_url);
  const targetDomain = workspace.custom_domain || getDefaultSubdomain(workspace.website_url) || `${workspace.slug || 'help'}.chatify.dev`;
  const isVerified = workspace.custom_domain_status === 'verified';
  const status = workspace.custom_domain_status || 'pending';
  const verificationToken = workspace.custom_domain_verification_token || '';

  return {
    targetDomain,
    websiteDomain,
    isVerified,
    isCustom: !!workspace.custom_domain,
    status,
    verificationToken,
    publicUrl: getWorkspaceHelpCenterUrl(workspace),
  };
}

/**
 * Expected DNS records for custom domain verification.
 */
export function getExpectedDnsRecords(workspace: Workspace) {
  const domain = cleanDomain(workspace.custom_domain || getDefaultSubdomain(workspace.website_url));
  const token = workspace.custom_domain_verification_token || 'chatify-verify-token';

  // Subdomain prefix (e.g., "help" from "help.apexshoes.com")
  const parts = domain.split('.');
  const hostRecord = parts.length > 2 ? parts[0] : '@';

  return {
    domain,
    cname: {
      type: 'CNAME',
      name: hostRecord,
      value: 'cname.chatify.dev',
      description: 'Points your custom subdomain to Chatify servers',
    },
    txt: {
      type: 'TXT',
      name: `_chatify-challenge.${hostRecord === '@' ? '' : hostRecord}`.replace(/\.$/, ''),
      value: `chatify-site-verification=${token}`,
      description: 'Verifies domain ownership before activation',
    },
  };
}
