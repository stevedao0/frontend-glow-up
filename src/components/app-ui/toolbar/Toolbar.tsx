import type React from 'react';

export function Toolbar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ds-toolbar flex flex-wrap justify-between rounded-2xl ${className}`}>{children}</div>;
}
