import type React from 'react';
import { Chip } from './Chip';

export type CountChipProps = {
  value: number | string;
  label?: string;
  className?: string;
};

export function CountChip({ value, label, className = '' }: CountChipProps) {
  return (
    <Chip className={className} tone="neutral">
      <span className="font-semibold nums">{value}</span>
      {label ? <span className="text-[color:var(--text-muted)]">{label}</span> : null}
    </Chip>
  );
}
