'use client';

import React from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { PageHeader } from '../ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

export default function Settings() {
  const { db, updateOutlet } = useWashflow();
  const o = db.outlet;
  return (
    <div>
      <PageHeader title="Pengaturan Outlet" desc="Data outlet yang tampil pada struk & header" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4" /> Identitas Outlet</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="mb-1.5 block">Nama Outlet</Label><Input value={o.name} onChange={(e) => updateOutlet({ name: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Alamat</Label><Input value={o.address} onChange={(e) => updateOutlet({ address: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Telepon</Label><Input value={o.phone} onChange={(e) => updateOutlet({ phone: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Ucapan Struk</Label><Input value={o.footer} onChange={(e) => updateOutlet({ footer: e.target.value })} /></div>
          <button onClick={() => toast.success('Pengaturan outlet tersimpan')} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Simpan</button>
        </CardContent>
      </Card>
    </div>
  );
}
