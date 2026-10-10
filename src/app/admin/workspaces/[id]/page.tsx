import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceDetailPage } from '@/components/admin/WorkspaceDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Workspace Detail — Zentry Super Admin',
  description: 'Inspect workspace metrics, members, channels, and private platform owner notes.',
};

export default async function WorkspacePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/workspaces/${id}`);
  }

  // Enforce server-side authorization: only platform super admin
  const { data: agent } = await supabase
    .from('agents')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!agent?.is_super_admin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-invert text-white p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">403 - Forbidden</h1>
          <p className="text-sm text-ink-3">
            Access denied. Platform super administrator privileges are required to view this workspace.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 rounded-xl bg-invert hover:bg-ink-2 text-white text-xs font-semibold transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <WorkspaceDetailPage workspaceId={id} />;
}
