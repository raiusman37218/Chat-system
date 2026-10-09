import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isPlatformHost,
  parseHelpBaseSubdomain,
  isHelpBaseHost,
  cleanDomain,
  HELP_BASE_DOMAIN,
} from '@/lib/domain';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Host-based routing for Custom Domains and Help Center subdomains
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] || '';
  const pathname = request.nextUrl.pathname;

  // 1. Ready-made Help Center Subdomain routing (<slug>.HELP_BASE_DOMAIN)
  const { isSubdomain, slug: helpSlug } = parseHelpBaseSubdomain(host);

  if (isSubdomain && helpSlug) {
    const { data: matches } = await supabase
      .from('public_workspaces')
      .select('id, slug, custom_domain, custom_domain_status')
      .eq('slug', helpSlug)
      .limit(1);

    const ws = matches?.[0];

    if (ws) {
      // If the custom domain is live (verified), redirect the platform subdomain to it
      if (ws.custom_domain && (ws.custom_domain_status === 'live' || ws.custom_domain_status === 'verified')) {
        const liveDomain = cleanDomain(ws.custom_domain);
        const liveUrl = new URL(`https://${liveDomain}${pathname}`);
        liveUrl.search = request.nextUrl.search;
        return NextResponse.redirect(liveUrl, 308);
      }

      // Sitemap routing on subdomain (e.g. acme.zentryhelp.com/sitemap.xml)
      if (pathname === '/sitemap.xml') {
        const sitemapUrl = request.nextUrl.clone();
        sitemapUrl.pathname = `/help/${ws.id}/sitemap.xml`;
        return NextResponse.rewrite(sitemapUrl, {
          request: { headers: request.headers },
        });
      }

      // Root Help Center on subdomain (e.g. acme.zentryhelp.com/)
      if (pathname === '/' || pathname === '') {
        const helpUrl = request.nextUrl.clone();
        helpUrl.pathname = `/help/${ws.id}`;
        return NextResponse.rewrite(helpUrl, {
          request: { headers: request.headers },
        });
      }

      // If someone hit /help/<slug> on the subdomain itself, normalize to clean root
      if (pathname === `/help/${ws.slug}` || pathname === `/help/${ws.id}`) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.pathname = '/';
        return NextResponse.redirect(cleanUrl, 308);
      }
      if (pathname.startsWith(`/help/${ws.slug}/`) || pathname.startsWith(`/help/${ws.id}/`)) {
        const subPath = pathname.replace(new RegExp(`^/help/(?:${ws.slug}|${ws.id})`), '');
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.pathname = subPath || '/';
        return NextResponse.redirect(cleanUrl, 308);
      }

      // Direct article paths (e.g. acme.zentryhelp.com/getting-started)
      if (
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/help')
      ) {
        const articleUrl = request.nextUrl.clone();
        articleUrl.pathname = `/help/${ws.id}${pathname}`;
        return NextResponse.rewrite(articleUrl, {
          request: { headers: request.headers },
        });
      }
    }
  }

  // 2. Custom Domain routing (e.g. support.mycompany.com)
  if (!isSubdomain && !isPlatformHost(host) && !isHelpBaseHost(host)) {
    const { data: matches } = await supabase
      .from('public_workspaces')
      .select('id, custom_domain, custom_domain_status')
      .ilike('custom_domain', host)
      .limit(1);

    const ws = matches?.[0];

    if (ws) {
      // Sitemap routing
      if (pathname === '/sitemap.xml') {
        const sitemapUrl = request.nextUrl.clone();
        sitemapUrl.pathname = `/help/${ws.id}/sitemap.xml`;
        return NextResponse.rewrite(sitemapUrl, {
          request: { headers: request.headers },
        });
      }

      // Root Help Center
      if (pathname === '/' || pathname === '') {
        const helpUrl = request.nextUrl.clone();
        helpUrl.pathname = `/help/${ws.id}`;
        return NextResponse.rewrite(helpUrl, {
          request: { headers: request.headers },
        });
      }

      // Article direct path (e.g. support.mycompany.com/article-slug)
      if (
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/help')
      ) {
        const articleUrl = request.nextUrl.clone();
        articleUrl.pathname = `/help/${ws.id}${pathname}`;
        return NextResponse.rewrite(articleUrl, {
          request: { headers: request.headers },
        });
      }
    }
  }

  // 3. Keep /help/<slug> working and redirect it to the subdomain (or verified custom domain)
  if (pathname.startsWith('/help') && !isSubdomain) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'help') {
      const slugOrId = segments[1];
      if (slugOrId !== 'api' && slugOrId !== '_next' && slugOrId !== 'sitemap.xml') {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        const { data: wsList } = isUuid
          ? await supabase
              .from('public_workspaces')
              .select('id, slug, custom_domain, custom_domain_status')
              .eq('id', slugOrId)
              .limit(1)
          : await supabase
              .from('public_workspaces')
              .select('id, slug, custom_domain, custom_domain_status')
              .eq('slug', slugOrId)
              .limit(1);

        const targetWs = wsList?.[0];

        if (targetWs) {
          const rest = segments.slice(2).join('/');
          const subPath = rest ? `/${rest}` : '';

          // If workspace has a live/verified custom domain, redirect to it
          if (targetWs.custom_domain && (targetWs.custom_domain_status === 'live' || targetWs.custom_domain_status === 'verified')) {
            const customUrl = new URL(`https://${cleanDomain(targetWs.custom_domain)}${subPath}`);
            customUrl.search = request.nextUrl.search;
            return NextResponse.redirect(customUrl, 308);
          }

          // Otherwise redirect to ready-made platform subdomain (<slug>.HELP_BASE_DOMAIN)
          if (HELP_BASE_DOMAIN) {
            const targetSlug = targetWs.slug || targetWs.id;
            const proto = HELP_BASE_DOMAIN.includes('localhost') ? 'http' : 'https';
            const redirectUrl = new URL(`${proto}://${targetSlug}.${HELP_BASE_DOMAIN}${subPath}`);
            redirectUrl.search = request.nextUrl.search;
            return NextResponse.redirect(redirectUrl, 308);
          }
        }
      }
    }
  }

  // Agent dashboard requires a session — send logged-out visitors to sign in
  // and bring them back afterwards.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // An account with an authenticator app must finish the code step before
    // it sees the inbox. getAuthenticatorAssuranceLevel reads the session's
    // own token, so this costs no extra request.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('mfa', '1');
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Platform super admin protection for /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!agent?.is_super_admin) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Platform super admin privileges required.',
        }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (widget.js, demo.html, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|widget.js|demo.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
