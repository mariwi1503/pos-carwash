'use client';

import React, { useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { PageHeader } from '../ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CarFront, Pencil, Plus, Trash2 } from 'lucide-react';

const TEMPLATE_OPTIONS = [
  { id: 'motor', name: 'Motor' },
  { id: 'mobil', name: 'Mobil' },
  { id: 'truk', name: 'Truk' },
  { id: 'bus', name: 'Bus' },
];

const EMPTY_FORM = { name: '', type: 'mobil' };

export default function VehicleTypes() {
  const {
    db, createVehicleCategory, updateVehicleCategory, deleteVehicleCategory,
  } = useWashflow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const categories = useMemo(() => db.vehicleCategories.slice().sort((a, b) => a.name.localeCompare(b.name, 'id')), [db.vehicleCategories]);
  const usage = useMemo(() => Object.fromEntries(db.vehicleCategories.map((category) => [
    category.id,
    db.vehicles.filter((vehicle) => vehicle.categoryId === category.id).length,
  ])), [db.vehicleCategories, db.vehicles]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, type: category.type });
    setError('');
    setDialogOpen(true);
  };

  const submit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Nama tipe kendaraan wajib diisi.');
      return;
    }
    if (db.vehicleCategories.some((category) => category.id !== editingId && category.name.trim().toLowerCase() === name.toLowerCase())) {
      setError('Nama tipe kendaraan sudah digunakan.');
      return;
    }
    if (editingId) {
      updateVehicleCategory(editingId, { name, type: form.type });
      toast.success('Tipe kendaraan berhasil diperbarui');
    } else {
      createVehicleCategory({ name, type: form.type });
      toast.success('Tipe kendaraan berhasil ditambahkan');
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget || usage[deleteTarget.id] > 0) return;
    deleteVehicleCategory(deleteTarget.id);
    toast.success('Tipe kendaraan berhasil dihapus');
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Tipe Kendaraan"
        desc="Kelola tipe kendaraan yang tersedia pada penerimaan dan master inspeksi"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Tipe</Button>}
      />

      <div className="space-y-3">
        {categories.map((category) => {
          const vehicleCount = usage[category.id] || 0;
          const pointCount = db.inspectionCatalog?.[category.id]?.length || 0;
          const templateName = TEMPLATE_OPTIONS.find((item) => item.id === category.type)?.name || category.type;
          return (
            <Card key={category.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CarFront className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="font-semibold">{category.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Template: {templateName}</span>
                      <span>{pointCount} poin inspeksi</span>
                      <span>{vehicleCount} kendaraan terdaftar</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(category)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={vehicleCount > 0}
                    title={vehicleCount > 0 ? 'Tipe yang sudah digunakan kendaraan tidak dapat dihapus' : 'Hapus tipe kendaraan'}
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(category)}
                  ><Trash2 className="h-3.5 w-3.5" /> Hapus</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setError(''); }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Tipe Kendaraan' : 'Tambah Tipe Kendaraan'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Perbarui nama atau kelompok tipe kendaraan.' : 'Poin dan harga inspeksi awal akan disalin dari template yang dipilih.'}
              </DialogDescription>
            </DialogHeader>
            <div className="my-5 space-y-4">
              <div>
                <Label htmlFor="vehicle-type-name" className="mb-1.5 block">Nama Tipe <span className="text-red-500">*</span></Label>
                <Input id="vehicle-type-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contoh: Mobil Premium" autoFocus />
              </div>
              <div>
                <Label htmlFor="vehicle-type-template" className="mb-1.5 block">Template Inspeksi</Label>
                <select
                  id="vehicle-type-template"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TEMPLATE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Mengubah template pada tipe lama tidak mereset poin inspeksi yang sudah diatur.</p>
              </div>
              {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Tambah Tipe'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tipe kendaraan?</AlertDialogTitle>
            <AlertDialogDescription>Tipe “{deleteTarget?.name}” beserta konfigurasi poin inspeksinya akan dihapus. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
