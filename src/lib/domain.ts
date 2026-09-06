import { Workspace } from '@/types/database';

/**
 * Where customers point their CNAME.
 *
 * This used to be hardcoded to `cname.chatify.dev` — a host this project does
 * not own. It resolves to an unrelated server, so every customer who followed
 * our instructions pointed their subdomain at a stranger and got
 * ERR_CERT_COMMON_NAME_INVALID, because that server naturally has no
 * certificate for their domain.
 *
 * Vercel's shared CNAME target is the correct default; override it with
 * NEXT_PUBLIC_CNAME_TARGET if the platform ever moves.
 */
export const CNAME_TARGET =
  process.env.NEXT_PUBLIC_CNAME_TARGET || 'cname.vercel-dns.com';

/**
 * Where customers point an apex domain (mycompany.com with no subdomain).
 *
 * A CNAME cannot legally sit on an apex record, and most registrars refuse to
 * save one, so those workspaces need an A record instead. Vercel's anycast
 * address is the default; override with NEXT_PUBLIC_APEX_A_RECORD.
 */
export const APEX_A_RECORD =
  process.env.NEXT_PUBLIC_APEX_A_RECORD || '76.76.21.21';

/**
 * Registry suffixes that are two labels long, so `acme.co.uk` is recognised as
 * an apex rather than as the subdomain "acme" of "co.uk". Not exhaustive — a
 * full public-suffix list is far heavier than this is worth — but it covers the
 * suffixes customers actually register under.
 */
const MULTI_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'me.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au', 'com.br', 'com.mx', 'com.ar',
  'co.nz', 'co.za', 'co.in', 'co.jp', 'co.kr', 'co.il',
  'com.pk', 'com.tr', 'com.sg', 'com.my', 'com.hk', 'com.tw',
  'com.cn', 'com.ua', 'com.pl', 'com.ph', 'com.vn', 'com.ng',
]);

/**
 * Splits a hostname into the DNS "host" field a registrar asks for and the
 * registrable domain, and says whether the record sits on the apex.
 * "help.acme.com"      -> { hostRecord: 'help',    isApex: false }
 * "help.eu.acme.co.uk" -> { hostRecord: 'help.eu', isApex: false }
 * "acme.co.uk"         -> { hostRecord: '@',       isApex: true  }
 */
export function splitDomain(domain: string): {
  hostRecord: string;
  rootDomain: string;
  isApex: boolean;
} {
  const parts = cleanDomain(domain).split('.').filter(Boolean);
  if (parts.length < 2) {
    return { hostRecord: '@', rootDomain: parts.join('.'), isApex: true };
  }

  const lastTwo = parts.slice(-2).join('.');
  const rootLength = MULTI_LABEL_SUFFIXES.has(lastTwo) ? 3 : 2;

  if (parts.length <= rootLength) {
    return { hostRecord: '@', rootDomain: parts.join('.'), isApex: true };
  }

  return {
    hostRecord: parts.slice(0, parts.length - rootLength).join('.'),
    rootDomain: parts.slice(parts.length - rootLength).join('.'),
    isApex: false,
  };
}

/** Hostnames that are the platform itself rather than a customer's domain. */
export function isPlatformHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0];
  const extra = (process.env.NEXT_PUBLIC_PLATFORM_HOSTS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.vercel.app') ||
    extra.includes(h)
  );
}

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
  article?: { id: string; slug?: string | null } | null,
  options?: {
    /**
     * The Host the current request came in on. Server code has no window to
     * read, so without this a page rendered on the customer's own domain still
     * emitted platform links — the sitemap served at
     * https://help.acme.com/sitemap.xml listed platform URLs, pointing search
     * engines away from the customer's domain and at ours.
     */
    host?: string | null;
  }
): string {
  if (!workspace) {
    return `${getPlatformOrigin()}/help`;
  }

  const articlePath = article ? `/${article.slug || article.id}` : '';

  // 0. Being served on the customer's own domain is stronger evidence than any
  // stored status: the request reached us there.
  const requestHost = options?.host?.toLowerCase().split(':')[0];
  if (
    requestHost &&
    !isPlatformHost(requestHost) &&
    workspace.custom_domain &&
    cleanDomain(workspace.custom_domain) === requestHost
  ) {
    return `https://${requestHost}${articlePath}`;
  }

  // 1. Verified custom domain mode
  if (workspace.custom_domain && workspace.custom_domain_status === 'verified') {
    const domain = cleanDomain(workspace.custom_domain);
    return `https://${domain}${articlePath}`;
  }

  // 2. Client-side check: if the page is currently being viewed through a custom domain
  if (typeof window !== 'undefined') {
    const host = window.location.host.toLowerCase().split(':')[0];
    const isPlatform = isPlatformHost(host);

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
  const targetDomain =
    workspace.custom_domain ||
    getDefaultSubdomain(workspace.website_url) ||
    '';
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

  const { hostRecord, isApex } = splitDomain(domain);

  // An apex domain gets an A record; a subdomain gets a CNAME. Handing every
  // customer the same CNAME row meant anyone using a bare domain was given a
  // record their registrar would not accept.
  const primary = isApex
    ? {
        type: 'A' as const,
        name: '@',
        value: APEX_A_RECORD,
        description: 'Points your domain at the servers that host your help centre',
      }
    : {
        type: 'CNAME' as const,
        name: hostRecord,
        value: CNAME_TARGET,
        description: 'Points your subdomain at the servers that host your help centre',
      };

  return {
    domain,
    isApex,
    primary,
    txt: {
      type: 'TXT' as const,
      name: isApex ? '_chatify-challenge' : `_chatify-challenge.${hostRecord}`,
      value: `chatify-site-verification=${token}`,
      description: 'Verifies domain ownership before activation',
    },
  };
}
