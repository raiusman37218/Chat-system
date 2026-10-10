import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { geoFromRequest } from '@/lib/geo';

// CORS headers to permit embedding on external websites
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Tracking endpoint handling:
 * 1. 'init' (First pageview & visitor registration/upsert)
 * 2. 'pageview' (SPA route change logging to visitor_page_history)
 * 3. 'heartbeat' (periodic ping updating last_seen_at, time_on_page & is_online)
 * 4. 'offline' (Tab closed / pagehide event beacon)
 * 5. 'expire' (Cleanup stale visitors offline after 90 seconds)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, visitor_id } = body;

    if (!visitor_id && event !== 'expire') {
      return NextResponse.json(
        { error: 'Missing visitor_id' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = serviceClient();

    // Extract real client IP from incoming proxy headers
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null;

    switch (event) {
      // 1. Initial page load: register/upsert visitor and record first page visit
      case 'init': {
        const {
          current_page_url,
          current_page_title,
          referrer_source,
          time_on_page = 0,
          workspace_id,
          device,
          browser,
          os,
          ip_location_city,
          ip_location_country,
          visit_count = 1,
        } = body;

        const geo = await geoFromRequest(req.headers);
        const city = geo.country ? geo.city : ip_location_city;
        const country = geo.country || ip_location_country;
        const nowIso = new Date().toISOString();

        // Upsert into visitors table
        const visitorPayload: Record<string, any> = {
          id: visitor_id,
          current_page_url: current_page_url || '/',
          current_url: current_page_url || '/',
          current_page_title: current_page_title || null,
          referrer_source: referrer_source || null,
          current_page_entered_at: nowIso,
          time_on_page_seconds: Math.max(0, Math.round(Number(time_on_page) || 0)),
          device: device || null,
          browser: browser || null,
          os: os || null,
          ip_location_city: city || null,
          ip_location_country: country || null,
          ip_address: clientIp,
          visit_count: Number(visit_count) || 1,
          is_online: true,
          last_seen_at: nowIso,
          last_seen: nowIso,
        };

        if (workspace_id) {
          visitorPayload.workspace_id = workspace_id;
        }

        const { error: visitorErr } = await supabase.from('visitors').upsert(visitorPayload);

        if (visitorErr) {
          console.error('[Tracker API] Error upserting visitor:', visitorErr);
        }

        // Log initial page to visitor_page_history
        if (current_page_url) {
          await supabase.from('visitor_page_history').insert({
            visitor_id,
            workspace_id: workspace_id || null,
            url: current_page_url,
            title: current_page_title || null,
            referrer: referrer_source || null,
            duration_seconds: Math.max(0, Math.round(Number(time_on_page) || 0)),
            visited_at: nowIso,
          });
        }

        return NextResponse.json(
          { success: true, action: 'registered' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 2. SPA Route Change / Client-Side Page Navigation
      case 'pageview': {
        const {
          url,
          title,
          referrer,
          duration_seconds = 0,
          workspace_id,
        } = body;

        if (!url) {
          return NextResponse.json(
            { error: 'Missing url' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const nowIso = new Date().toISOString();

        // Log page visit
        await supabase.from('visitor_page_history').insert({
          visitor_id,
          workspace_id: workspace_id || null,
          url,
          title: title || null,
          referrer: referrer || null,
          duration_seconds: Math.max(0, Math.round(Number(duration_seconds) || 0)),
          visited_at: nowIso,
        });

        // Update visitor current URL, page title and presence
        const updatePayload: Record<string, any> = {
          current_page_url: url,
          current_url: url,
          current_page_title: title || null,
          current_page_entered_at: nowIso,
          time_on_page_seconds: 0,
          last_seen_at: nowIso,
          last_seen: nowIso,
          is_online: true,
        };

        if (referrer) updatePayload.referrer_source = referrer;
        if (workspace_id) updatePayload.workspace_id = workspace_id;

        await supabase.from('visitors').update(updatePayload).eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'page_logged' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 3. Heartbeat Ping
      case 'heartbeat': {
        const {
          current_page_url,
          current_page_title,
          referrer_source,
          time_on_page = 0,
        } = body;

        const nowIso = new Date().toISOString();
        const updates: Record<string, any> = {
          last_seen_at: nowIso,
          last_seen: nowIso,
          is_online: true,
          time_on_page_seconds: Math.max(0, Math.round(Number(time_on_page) || 0)),
        };

        if (current_page_url) {
          updates.current_page_url = current_page_url;
          updates.current_url = current_page_url;
        }
        if (current_page_title) updates.current_page_title = current_page_title;
        if (referrer_source) updates.referrer_source = referrer_source;

        await supabase.from('visitors').update(updates).eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'heartbeat_received' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 4. Page Unload / Offline beacon
      case 'offline': {
        const nowIso = new Date().toISOString();
        await supabase
          .from('visitors')
          .update({
            is_online: false,
            last_seen_at: nowIso,
            last_seen: nowIso,
          })
          .eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'marked_offline' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 5. Expire stale visitors (stale threshold default 90s)
      case 'expire': {
        const staleSeconds = Number(body.stale_seconds) || 90;
        const thresholdIso = new Date(Date.now() - staleSeconds * 1000).toISOString();

        const { data, error } = await supabase
          .from('visitors')
          .update({ is_online: false })
          .eq('is_online', true)
          .lt('last_seen_at', thresholdIso)
          .select('id');

        return NextResponse.json(
          { success: true, expired_count: data?.length || 0 },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400, headers: CORS_HEADERS }
        );
    }
  } catch (err: any) {
    console.error('[Tracker API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
