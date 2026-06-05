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
    'btn-copper-glow bg-gradient-to-b from-[#d4a878] via-[#b9854f] to-[#8a5d33] text-white hover:from-[#dcb486] hover:via-[#c89968] hover:to-[#9c6d3e] active:from-[#b88858] active:to-[#7a4f2a] ring-1 ring-inset ring-[#f0d4a8]/55',
  secondary:
    'bg-white text-[#5a4533] ring-1 ring-[#e3d2b3] hover:bg-[#fcfaf5] hover:ring-[#c89968]/60 shadow-xs',
  ghost: 'text-[#5a4533] hover:bg-[#c89968]/10 hover:text-[#2d1f14]',
  glass:
    'bg-white/40 text-[#2d1f14] ring-1 ring-inset ring-[#c89968]/30 hover:bg-white/60 backdrop-blur-sm',
  glassPrimary:
    'bg-gradient-to-b from-[#e8c4a0] via-[#c89968] to-[#9c6d3e] text-white hover:from-[#f0d0b0] hover:via-[#d4a878] hover:to-[#a87a4a] active:from-[#c89968] active:to-[#8a5d33] shadow-lg shadow-[#9c6d3e]/40 ring-1 ring-inset ring-[#f0d4a8]/60 font-semibold',
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
