'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'scrollbar-hide sticky top-0 left-0 z-50 flex w-full flex-wrap items-center gap-1 rounded-t-lg border-b border-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        props.className
      )}
    />
  );
}
