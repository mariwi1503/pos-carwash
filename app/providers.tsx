'use client';

// Client-only context wrapper.

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { WashflowProvider } from '@/lib/washflow/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <WashflowProvider>{children}</WashflowProvider>
      <Toaster richColors position="top-center" />
    </>
  );
}
