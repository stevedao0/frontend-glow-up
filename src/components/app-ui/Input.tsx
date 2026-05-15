import React from 'react';
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
};
export function Input({
  label,
  error,
  hint,
  required,
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[11px] font-medium text-fg-secondary">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <input
        {...rest}
        className={`h-9 px-3 text-sm rounded-lg bg-surface text-fg-primary ring-1 ring-zinc-200 hover:ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition-shadow duration-fast shadow-xs placeholder:text-fg-subtle disabled:bg-surface-subtle disabled:text-fg-muted disabled:cursor-not-allowed ${error ? 'ring-rose-300 focus:ring-danger/40' : ''} ${className}`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
      {hint && !error && <span className="text-xs text-fg-muted">{hint}</span>}
    </div>
  );
}
