import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};
export function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  size = 'md',
  className = '',
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}) {
  const h = size === 'sm' ? 'h-8' : 'h-9';
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-medium text-fg-secondary">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`appearance-none w-full ${h} pl-3 pr-8 text-sm rounded-lg bg-surface text-fg-primary ring-1 ring-zinc-200 hover:ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition-shadow duration-fast shadow-xs ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-50' : ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted"
        />
      </div>
    </div>
  );
}
