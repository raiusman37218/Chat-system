import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

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
 * 3. 'heartbeat' (15s ping updating last_seen_at & is_online)
 * 4. 'offline' (Tab closed / pagehide event)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, visitor_id } = body;

    if (!visitor_id) {
      return NextResponse.json(
        { error: 'Missing visitor_id' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = getSupabase();

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
          device,
          browser,
          os,
          ip_location_city,
          ip_location_country,
          visit_count = 1,
        } = body;

        // Upsert into visitors table
        const { error: visitorErr } = await supabase.from('visitors').upsert({
          id: visitor_id,
          current_page_url: current_page_url || '/',
          current_page_title: current_page_title || null,
          referrer_source: referrer_source || null,
          device: device || null,
          browser: browser || null,
          os: os || null,
          ip_location_city: ip_location_city || null,
          ip_location_country: ip_location_country || null,
          ip_address: clientIp,
          visit_count: Number(visit_count) || 1,
          is_online: true,
          last_seen_at: new Date().toISOString(),
        });

        if (visitorErr) {
          console.error('[Tracker API] Error upserting visitor:', visitorErr);
        }

        // Log initial page to visitor_page_history
        if (current_page_url) {
          await supabase.from('visitor_page_history').insert({
            visitor_id,
            url: current_page_url,
            title: current_page_title || null,
            visited_at: new Date().toISOString(),
          });
        }

        return NextResponse.json(
          { success: true, action: 'registered' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 2. SPA Route Change / New Page Navigation
      case 'pageview': {
        const { url, title } = body;
        if (!url) {
          return NextResponse.json(
            { error: 'Missing url' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        // Log page visit
        await supabase.from('visitor_page_history').insert({
          visitor_id,
          url,
          title: title || null,
          visited_at: new Date().toISOString(),
        });

        // Update visitor current URL and presence
        await supabase
          .from('visitors')
          .update({
            current_page_url: url,
            current_page_title: title || null,
            last_seen_at: new Date().toISOString(),
            is_online: true,
          })
          .eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'page_logged' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 3. 15-Second Heartbeat Ping
      case 'heartbeat': {
        const { current_page_url, current_page_title } = body;

        const updates: Record<string, any> = {
          last_seen_at: new Date().toISOString(),
          is_online: true,
        };
        if (current_page_url) updates.current_page_url = current_page_url;
        if (current_page_title) updates.current_page_title = current_page_title;

        await supabase.from('visitors').update(updates).eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'heartbeat_received' },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // 4. Page Unload / Offline beacon
      case 'offline': {
        await supabase
          .from('visitors')
          .update({
            is_online: false,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', visitor_id);

        return NextResponse.json(
          { success: true, action: 'marked_offline' },
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
