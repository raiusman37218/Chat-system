import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SMTPSettingsConfig } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, smtpSettings } = body as {
      workspaceId: string;
      smtpSettings: SMTPSettingsConfig;
    };

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('workspaces')
      .update({
        smtp_settings: smtpSettings,
      })
      .eq('id', workspaceId);

    if (error) {
      console.error('[Save SMTP Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP settings saved successfully',
    });
  } catch (error: any) {
    console.error('[Save SMTP Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save SMTP settings' },
      { status: 500 }
    );
  }
}
