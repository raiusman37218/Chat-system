'use client';

import React from 'react';
import { WorkspaceDetailView } from './WorkspaceDetailView';

export interface WorkspaceDetailPageProps {
  workspaceId: string;
  initialData?: any;
}

export function WorkspaceDetailPage({ workspaceId }: WorkspaceDetailPageProps) {
  return <WorkspaceDetailView workspaceId={workspaceId} />;
}
