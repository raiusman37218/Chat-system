import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { verifyCsatToken } from '@/lib/csat/token';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticket_id');
    const token = searchParams.get('token');

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticket_id' }, { status: 400, headers: CORS_HEADERS });
    }

    const supabase = serviceClient();
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('id, number, subject, status, workspace_id, csat_rating, csat_comment, csat_rated_at, workspace:workspaces(id, name, logo_url, brand_color)')
      .eq('id', ticketId)
      .maybeSingle();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // If token provided, verify it (or allow checking if not required for preview)
    const validToken = token ? verifyCsatToken(ticket.id, ticket.workspace_id, token) : true;

    return NextResponse.json(
      {
        ticket: {
          id: ticket.id,
          number: ticket.number,
          subject: ticket.subject,
          status: ticket.status,
          csat_rating: ticket.csat_rating,
          csat_comment: ticket.csat_comment,
          csat_rated_at: ticket.csat_rated_at,
          workspace: ticket.workspace,
        },
        token_valid: validToken,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    console.error('[CSAT Get Error]:', err);
    return NextResponse.json({ error: 'Could not load ticket details' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticket_id, conversation_id, rating, comment, token } = body;

    if (!rating || !['good', 'bad'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be either "good" or "bad"' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!ticket_id && !conversation_id) {
      return NextResponse.json(
        { error: 'Either ticket_id or conversation_id must be provided' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = serviceClient();

    // 1. Locate ticket
    let ticketQuery = supabase.from('tickets').select('*');
    if (ticket_id) {
      ticketQuery = ticketQuery.eq('id', ticket_id);
    } else if (conversation_id) {
      ticketQuery = ticketQuery.eq('conversation_id', conversation_id);
    }

    const { data: ticket, error: findErr } = await ticketQuery.maybeSingle();
    if (findErr || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // 2. Token verification if token supplied
    if (token && !verifyCsatToken(ticket.id, ticket.workspace_id, token)) {
      return NextResponse.json({ error: 'Invalid or expired survey token' }, { status: 403, headers: CORS_HEADERS });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : null;
    const now = new Date().toISOString();

    // 3. Update tickets table
    const { error: updateTicketErr } = await supabase
      .from('tickets')
      .update({
        csat_rating: rating,
        csat_comment: trimmedComment || null,
        csat_rated_at: now,
      })
      .eq('id', ticket.id);

    if (updateTicketErr) {
      console.error('[CSAT Update Ticket Error]:', updateTicketErr);
      return NextResponse.json({ error: 'Failed to record rating on ticket' }, { status: 500, headers: CORS_HEADERS });
    }

    // 4. Sync to conversation if ticket is linked to a conversation
    const convId = ticket.conversation_id || conversation_id;
    if (convId) {
      await supabase
        .from('conversations')
        .update({
          csat_rating: rating === 'good' ? 5 : 1,
          csat_feedback: trimmedComment || null,
        })
        .eq('id', convId);
    }

    // 5. Explicitly ensure reporting_events has the rating recorded
    await supabase.from('reporting_events').insert({
      workspace_id: ticket.workspace_id,
      ticket_id: ticket.id,
      event_type: 'csat_rated',
      occurred_at: now,
      agent_id: ticket.assignee_id,
      group_id: ticket.group_id,
      channel: ticket.channel,
      priority: ticket.priority,
      tags: ticket.tags || [],
      csat_rating: rating,
      csat_comment: trimmedComment || null,
    });

    return NextResponse.json(
      {
        success: true,
        rating,
        comment: trimmedComment,
        ticket_id: ticket.id,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    console.error('[CSAT Submit Error]:', err);
    return NextResponse.json({ error: 'Could not submit rating' }, { status: 500, headers: CORS_HEADERS });
  }
}
