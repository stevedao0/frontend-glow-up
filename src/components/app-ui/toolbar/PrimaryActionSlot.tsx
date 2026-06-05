import type React from 'react';

export function PrimaryActionSlot({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ml-auto inline-flex items-center gap-2 ${className}`}>{children}</div>;
}
