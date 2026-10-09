import { NextResponse } from 'next/server';
import { hasServiceRole } from '@/lib/supabase/service';
import { processOutboundQueue } from '@/lib/channels/outbound';

export const dynamic = 'force-dynamic';

/**
 * Sends what the channel outbound queue has due: retries after a provider
 * outage or rate limit, and anything a worker left half-sent. Replies are
 * normally sent the moment they are written; this is the safety net.
 *
 * Needs `Authorization: Bearer $CRON_SECRET` (Vercel adds it to cron calls).
 * vercel.json runs it daily, the most often the Hobby plan allows; on Pro,
 * change the schedule to every minute so a retry is never more than a minute
 * late, or call it from any scheduler with the same header.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasServiceRole()) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' }, { status: 500 });
  }
  const totals = { claimed: 0, sent: 0, retrying: 0, failed: 0 };
  // Drain in batches, within the function's time budget.
  const until = Date.now() + 45_000;
  while (Date.now() < until) {
    const batch = await processOutboundQueue({ limit: 50 });
    totals.claimed += batch.claimed;
    totals.sent += batch.sent;
    totals.retrying += batch.retrying;
    totals.failed += batch.failed;
    if (batch.claimed < 50) break;
  }
  return NextResponse.json(totals);
}

export const GET = handle;
export const POST = handle;
