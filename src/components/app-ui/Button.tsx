import React from 'react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'glassPrimary' | 'danger';
type Size = 'sm' | 'md' | 'lg';
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
};
const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-emerald-700 to-emerald-800 text-white hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-800 active:to-emerald-900 ring-1 ring-inset ring-[#c89968]/40 shadow-md shadow-emerald-950/30',
  secondary:
    'bg-surface text-fg-secondary ring-1 ring-zinc-200 hover:bg-surface-subtle hover:ring-zinc-300 shadow-xs',
  ghost: 'text-fg-secondary hover:bg-surface-muted hover:text-fg-primary',
  glass:
    'bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 backdrop-blur-sm',
  glassPrimary:
    'bg-[#c89968] text-emerald-950 hover:bg-[#d4b760] active:bg-[#b89638] shadow-lg shadow-amber-950/30 ring-1 ring-inset ring-amber-200/40 font-semibold',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 shadow-sm',
};
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};
export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-fast ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {leftIcon && <span className="-ml-0.5 shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="-mr-0.5 shrink-0">{rightIcon}</span>}
    </button>
  );
}
