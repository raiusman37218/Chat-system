import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging OAuth code:', exchangeError.message);
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      // Check if user has an existing workspace
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        const { data: agent } = await supabase
          .from('agents')
          .select('workspace_id')
          .eq('id', session.user.id)
          .maybeSingle();

        const { data: ownedWs } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', session.user.id)
          .limit(1)
          .maybeSingle();

        // If new user with no workspace, send to onboarding
        if (!agent?.workspace_id && !ownedWs?.id) {
          return NextResponse.redirect(`${baseUrl}/onboarding`);
        }
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    } catch (err: any) {
      console.error('Unexpected auth callback error:', err);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(err.message || 'Authentication callback failed')}`
      );
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=no_auth_code`);
}
