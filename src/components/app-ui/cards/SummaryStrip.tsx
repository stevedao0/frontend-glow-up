import type React from 'react';

export function SummaryStrip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>;
}
