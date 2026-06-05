import type React from 'react';

export function AppCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`ds-card rounded-2xl ${className}`}>{children}</section>;
}
