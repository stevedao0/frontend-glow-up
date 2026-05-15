import React from 'react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'glassPrimary';
type Size = 'sm' | 'md' | 'lg';
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm'
};
const variants: Record<Variant, string> = {
  primary:
  'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm shadow-zinc-900/10 active:bg-zinc-950',
  secondary:
  'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300 shadow-sm shadow-zinc-900/[0.03]',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  glass:
  'bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 backdrop-blur-sm',
  glassPrimary:
  'bg-white text-zinc-900 hover:bg-zinc-50 shadow-lg shadow-indigo-950/30 ring-1 ring-white/40'
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}>
      
      {leftIcon && <span className="-ml-0.5 shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="-mr-0.5 shrink-0">{rightIcon}</span>}
    </button>);

}