import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { clientIpOf, geoFromRequest } from '@/lib/geo';

// Called by the embeddable widget from the customer's own site.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Stores the visitor's city and country, worked out from the request's own IP
 * on the server. The browser cannot supply (or fake) the location: only the
 * visitor id comes from the body.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId: string | undefined = body.visitor_id || body.visitorId;
    if (!visitorId || !UUID_RE.test(visitorId)) {
      return NextResponse.json({ error: 'Missing visitor_id' }, { status: 400, headers: CORS_HEADERS });
    }

    const geo = await geoFromRequest(req.headers);
    if (!geo.country) {
      return NextResponse.json({ success: false, reason: 'Location unknown' }, { headers: CORS_HEADERS });
    }

    const location = geo.city ? `${geo.city}, ${geo.country}` : geo.country;
    const supabase = serviceClient();
    const { error } = await supabase
      .from('visitors')
      .update({
        location,
        ip_location_city: geo.city,
        ip_location_country: geo.country,
        ip_address: clientIpOf(req.headers),
      })
      .eq('id', visitorId);

    if (error) {
      // Older databases may lack one of these columns; the two that every
      // schema has are what the dashboard reads first.
      await supabase
        .from('visitors')
        .update({ ip_location_city: geo.city, ip_location_country: geo.country })
        .eq('id', visitorId);
    }

    return NextResponse.json(
      { success: true, city: geo.city, country: geo.country, countryCode: geo.countryCode, location },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Geo lookup failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
