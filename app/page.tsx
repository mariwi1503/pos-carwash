'use client';

import React from 'react';
import { useWashflow } from '@/lib/washflow/store';
import Login from '@/components/washflow/Login';
import Shell from '@/components/washflow/Shell';
import { Droplets } from 'lucide-react';

function App() {
  const { ready, session } = useWashflow();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Droplets className="h-6 w-6" /></div>
          <span className="text-sm">Memuat WashFlow...</span>
        </div>
      </div>
    );
  }
  return session ? <Shell /> : <Login />;
}

export default App;
