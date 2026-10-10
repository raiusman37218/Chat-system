import React from 'react';
import { PlansManagementView } from '@/components/admin/PlansManagementView';

export const metadata = {
  title: 'Plans & Pricing — Zentry Super Admin',
  description: 'Manage platform subscription tiers, resource limits, features, and coupons.',
};

export default function AdminPlansPage() {
  return <PlansManagementView />;
}
