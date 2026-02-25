// src/app/dashboard/layout.tsx
import { DashboardShell } from '@/src/components/dashboard/DashboardShell';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
