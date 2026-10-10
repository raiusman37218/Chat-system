import React from 'react';
import { PlatformOpsView } from '@/components/admin/PlatformOpsView';

export const metadata = {
  title: 'Platform Operations & Control — ZenTry Super Admin',
  description: 'Manage global feature flags, announcements, system settings, email templates, and platform staff.',
};

export default function AdminPlatformOpsPage() {
  return <PlatformOpsView />;
}
