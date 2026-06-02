import React from 'react';
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
};
export function Textarea({
  label,
  error,
  hint,
  required,
  className = '',
  ...rest
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label &&
      <label className="text-[11px] font-medium text-fg-secondary">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      }
      <textarea
        {...rest}
        className={`min-h-[80px] px-3 py-2 text-sm rounded-lg bg-white text-zinc-900 ring-1 ring-zinc-200 hover:ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-600/40 transition-shadow shadow-sm shadow-zinc-900/[0.03] placeholder:text-zinc-400 resize-y disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${error ? 'ring-rose-300 focus:ring-rose-500/40' : ''} ${className}`} />
      
      {error && <span className="text-xs text-danger">{error}</span>}
      {hint && !error && <span className="text-xs text-fg-muted">{hint}</span>}
    </div>);

}