'use client';

import { CursorOverlayPlugin } from '@platejs/selection/react';

import { CursorOverlay } from '@/components/ui/cursor-overlay';

export const CursorOverlayKit = [
  CursorOverlayPlugin.configure({
    options: {
      refreshOnResize: false,
    },
    render: {
      afterEditable: () => <CursorOverlay />,
    },
  }),
];
