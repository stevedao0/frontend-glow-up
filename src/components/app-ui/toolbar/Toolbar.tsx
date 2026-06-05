import React from 'react';

export function Toolbar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface)] px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {children}
    </div>
  );
}
