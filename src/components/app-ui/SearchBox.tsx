import React from 'react';
import { SearchIcon } from 'lucide-react';
export function SearchBox({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  size = 'md',
  kbd,
  className = ''







}: {value: string;onChange: (v: string) => void;placeholder?: string;size?: 'sm' | 'md' | 'lg';kbd?: string;className?: string;}) {
  const h = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-11' : 'h-9';
  const text = size === 'lg' ? 'text-base' : 'text-sm';
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${h} ${text} pl-9 pr-${kbd ? 14 : 3} rounded-lg bg-white/75 backdrop-blur-sm text-zinc-900 placeholder:text-zinc-400 ring-1 ring-[color:var(--border-warm)] hover:ring-[#c89968]/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c89968]/55 focus:shadow-[0_0_0_3px_rgba(200,153,104,0.18)] transition-all`} />
      
      {kbd &&
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 px-1.5 h-5 inline-flex items-center text-[10px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded">
          {kbd}
        </kbd>
      }
    </div>);

}