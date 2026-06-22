import React from 'react';
import { Loader2Icon } from 'lucide-react';
export function LoadingState({ label = 'Đang tải...' }: {label?: string;}) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
      <Loader2Icon className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>);

}