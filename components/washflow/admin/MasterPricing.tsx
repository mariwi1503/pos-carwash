'use client';

import React, { useEffect, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { DIRTINESS, ADDONS } from '@/lib/washflow/constants';
import { PageHeader } from '../ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MasterPricing() {
  const {
    db, updateInspectionPoint, addInspectionPoint, removeInspectionPoint, updateAddonPrice,
  } = useWashflow();
  const [categoryId, setCategoryId] = useState('');
  const points = db.inspectionCatalog?.[categoryId] || [];

  useEffect(() => {
    if (!db.vehicleCategories.some((category) => category.id === categoryId)) {
      setCategoryId(db.vehicleCategories[0]?.id || '');
    }
  }, [categoryId, db.vehicleCategories]);

  const removePoint = (item) => {
    if (!window.confirm(`Hapus poin inspeksi “${item.label}”? Order lama tidak akan berubah.`)) return;
    removeInspectionPoint(categoryId, item.id);
    toast.success('Poin inspeksi dihapus');
  };

  return (
    <div>
      <PageHeader
        title="Master Inspeksi & Harga"
        desc="Atur poin inspeksi dan harga ringan, sedang, serta berat untuk setiap tipe kendaraan"
        action={<Button variant="outline" onClick={() => toast.success('Perubahan tersimpan otomatis')}><Save className="mr-1.5 h-4 w-4" /> Tersimpan Otomatis</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {db.vehicleCategories.map((category) => (
          <button key={category.id} onClick={() => setCategoryId(category.id)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${categoryId === category.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-muted'}`}>{category.name}</button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Poin Inspeksi — {db.vehicleCategories.find((category) => category.id === categoryId)?.name || 'Belum ada tipe kendaraan'}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Harga setiap poin akan dijumlahkan tanpa biaya dasar.</p>
          </div>
          <Button size="sm" disabled={!categoryId} onClick={() => addInspectionPoint(categoryId)}><Plus className="mr-1.5 h-4 w-4" /> Tambah Poin</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-semibold">Nama Poin</th>
                {DIRTINESS.map((level) => <th key={level.id} className="p-3 font-semibold">{level.name}</th>)}
                <th className="w-16 p-3"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {points.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-2">
                    <Input value={item.label} onChange={(event) => updateInspectionPoint(categoryId, item.id, { label: event.target.value })} className="min-w-48" aria-label="Nama poin inspeksi" />
                  </td>
                  {DIRTINESS.map((level) => (
                    <td key={level.id} className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="500"
                        value={item.prices[level.id]}
                        onChange={(event) => updateInspectionPoint(categoryId, item.id, { prices: { [level.id]: Math.max(0, Number(event.target.value) || 0) } })}
                        className="w-32"
                        aria-label={`Harga ${item.label} ${level.name}`}
                      />
                    </td>
                  ))}
                  <td className="p-2 text-right">
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removePoint(item)} aria-label={`Hapus ${item.label}`}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {points.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Belum ada poin inspeksi untuk tipe kendaraan ini.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Harga Layanan Tambahan</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <span className="text-sm font-medium">{addon.name}</span>
              <Input type="number" min="0" value={db.addonPrices[addon.id]} onChange={(event) => updateAddonPrice(addon.id, event.target.value)} className="w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
