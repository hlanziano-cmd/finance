// src/app/balances/layout.tsx

// Force dynamic rendering for all balances pages
export const dynamic = 'force-dynamic';

export default function BalancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
