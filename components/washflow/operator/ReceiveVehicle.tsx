'use client';

import React, { type ChangeEvent, useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { ADDONS, DIRTINESS, isOrderClosed } from '@/lib/washflow/constants';
import { computePrice } from '@/lib/washflow/pricing';
import { rupiah, vehicleLabel } from '@/lib/washflow/format';
import { PageHeader, Money } from '../ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, History, ImagePlus, X, ArrowLeft, ArrowRight, CheckCircle2, UserRound } from 'lucide-react';

const STEPS = ['Data Kendaraan', 'Inspeksi', 'Estimasi & Pelanggan'];

function LevelChecklist({ item, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Tingkat kotor ${item.label}`}>
      {DIRTINESS.map((level) => {
        const selected = value === level.id;
        const selectedClass = {
          ringan: 'border-emerald-500 bg-emerald-50 text-emerald-800',
          sedang: 'border-amber-500 bg-amber-50 text-amber-800',
          berat: 'border-red-500 bg-red-50 text-red-800',
        }[level.id];
        return (
          <button
            key={level.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level.id)}
            className={`flex min-h-16 flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-colors ${selected ? selectedClass : 'bg-background hover:bg-muted'}`}
          >
            <span className="flex items-center gap-1 text-xs font-semibold">
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-current bg-current' : 'border-muted-foreground/40'}`}>
                {selected ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : null}
              </span>
              {level.name}
            </span>
            <span className="mt-1 text-[11px] tabular-nums opacity-80">{rupiah(item.prices[level.id])}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ReceiveVehicle({ navigate }) {
  const { db, findVehicleByPlate, vehicleHistory, getCustomer, getVehicleCategory, createOrder } = useWashflow();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    plate: '', withoutPlate: false, brand: '', color: '', categoryId: '',
    customerName: '', whatsapp: '', addonIds: [],
  });
  const [found, setFound] = useState(null);
  const [selections, setSelections] = useState({});
  const [visualNotes, setVisualNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [approved, setApproved] = useState(false);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const checklist = useMemo(() => db.inspectionCatalog?.[form.categoryId] || [], [db, form.categoryId]);
  const price = useMemo(() => computePrice(db, {
    categoryId: form.categoryId,
    inspectionSelections: selections,
    addonIds: form.addonIds,
  }), [db, form.categoryId, form.addonIds, selections]);

  const loadKnownVehicle = (vehicle, showToast = true) => {
    const customer = getCustomer(vehicle.customerId);
    setFound({ vehicle, customer, history: vehicleHistory(vehicle.id) });
    setForm((current) => ({
      ...current,
      plate: vehicle.plate || '',
      withoutPlate: !vehicle.plate,
      brand: vehicle.brand || '',
      color: vehicle.color || '',
      categoryId: vehicle.categoryId,
      customerName: customer?.name || '',
      whatsapp: customer?.whatsapp || '',
    }));
    setSelections({});
    if (showToast) toast.success('Kendaraan ditemukan — data kendaraan dimuat');
  };

  const lookupVehicle = (showToast = true) => {
    const vehicle = findVehicleByPlate(form.plate);
    if (vehicle) {
      loadKnownVehicle(vehicle, showToast);
      return vehicle;
    }
    setFound(null);
    set('customerName', '');
    set('whatsapp', '');
    if (showToast) toast.info('Kendaraan baru — lengkapi data kendaraan');
    return null;
  };

  const onPlateChange = (value) => {
    setForm((current) => found ? {
      ...current,
      plate: value.toUpperCase(),
      brand: '',
      color: '',
      categoryId: '',
      customerName: '',
      whatsapp: '',
    } : { ...current, plate: value.toUpperCase(), customerName: '', whatsapp: '' });
    if (found) setSelections({});
    setFound(null);
  };

  const setWithoutPlate = (checked) => {
    setForm((current) => ({
      ...current,
      withoutPlate: checked,
      plate: '',
      ...(found ? { brand: '', color: '', categoryId: '' } : {}),
      customerName: '',
      whatsapp: '',
    }));
    if (found) setSelections({});
    setFound(null);
  };

  const selectCategory = (categoryId) => {
    set('categoryId', categoryId);
    setSelections({});
  };

  const toggleAddon = (id) => set('addonIds', form.addonIds.includes(id)
    ? form.addonIds.filter((item) => item !== id)
    : [...form.addonIds, id]);

  const onPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' && setPhotos((current) => [...current, reader.result as string]);
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const next = () => {
    if (step === 0) {
      if ((!form.withoutPlate && !form.plate.trim()) || !form.brand.trim() || !form.color.trim() || !form.categoryId) {
        toast.error(`Lengkapi ${form.withoutPlate ? '' : 'nomor polisi, '}merek/model, warna, dan tipe kendaraan`);
        return;
      }
      const knownVehicle = form.withoutPlate ? null : findVehicleByPlate(form.plate);
      if (knownVehicle && !found) loadKnownVehicle(knownVehicle, false);
      const activeOrder = knownVehicle ? db.orders.find((order) => !isOrderClosed(order) && order.vehicleId === knownVehicle.id) : null;
      if (activeOrder) {
        toast.error(`Kendaraan masih memiliki order aktif ${activeOrder.orderNo}`);
        return;
      }
    }
    if (step === 1) {
      if (checklist.length === 0) {
        toast.error('Tipe kendaraan belum memiliki poin inspeksi di master data');
        return;
      }
      const unanswered = checklist.filter((item) => !selections[item.id]);
      if (unanswered.length > 0) {
        toast.error(`Lengkapi ${unanswered.length} poin inspeksi yang belum dipilih`);
        return;
      }
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const submit = () => {
    if (!approved) {
      toast.error('Konfirmasi persetujuan estimasi harga pelanggan');
      return;
    }
    if (!form.customerName.trim() || !form.whatsapp.trim()) {
      toast.error(found ? 'Konfirmasi nama dan nomor WhatsApp pelanggan' : 'Isi nama dan nomor WhatsApp pelanggan baru');
      return;
    }
    const order = createOrder({
      ...form,
      inspection: { selections, visualNotes, photos },
    });
    toast.success(`Order dibuat — No. Antrean #${order.queueNo}`, {
      description: `${order.orderNo} · ${rupiah(order.priceSnapshot.total)}`,
    });
    navigate('antrean');
  };

  return (
    <div className="pb-24">
      <PageHeader title="Terima Kendaraan" desc="Data kendaraan, inspeksi, lalu konfirmasi estimasi pelanggan" />

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{index + 1}</div>
              <span className={`hidden text-sm font-medium sm:block ${index === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {index < STEPS.length - 1 ? <div className={`h-0.5 flex-1 ${index < step ? 'bg-primary' : 'bg-border'}`} /> : null}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-5">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Checkbox checked={form.withoutPlate} onCheckedChange={(checked) => setWithoutPlate(checked === true)} />
              <span className="text-sm font-medium">Kendaraan tidak memiliki nomor polisi</span>
            </label>

            {!form.withoutPlate ? (
              <div>
                <Label className="mb-1.5 block">Nomor Polisi <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input value={form.plate} onChange={(event) => onPlateChange(event.target.value)} placeholder="B 1234 ABC" className="uppercase" />
                  <Button type="button" variant="secondary" onClick={() => lookupVehicle()}><Search className="mr-1.5 h-4 w-4" /> Periksa</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Nomor polisi akan disimpan kosong. Pembayaran kendaraan ini dapat dicari menggunakan nomor order atau nomor antrean.
              </div>
            )}

            {found && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-cyan-800"><History className="h-4 w-4" /> Kendaraan Terdaftar</div>
                <p className="text-sm text-cyan-900">{vehicleLabel(found.vehicle)} · {found.vehicle.brand} · {found.vehicle.color} · {found.history.length} kunjungan sebelumnya</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block">Merek / Model <span className="text-red-500">*</span></Label><Input value={form.brand} onChange={(event) => set('brand', event.target.value)} placeholder="Contoh: Toyota Avanza" /></div>
              <div><Label className="mb-1.5 block">Warna <span className="text-red-500">*</span></Label><Input value={form.color} onChange={(event) => set('color', event.target.value)} placeholder="Contoh: Hitam" /></div>
            </div>

            <div>
              <Label className="mb-2 block">Tipe Kendaraan <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {db.vehicleCategories.map((category) => (
                  <button key={category.id} type="button" onClick={() => selectCategory(category.id)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${form.categoryId === category.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-muted'}`}>{category.name}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-semibold">Inspeksi {getVehicleCategory(form.categoryId)?.name}</div>
              <div className="text-sm text-muted-foreground">Pilih satu tingkat kotor untuk setiap poin.</div>
            </div>
            <div className="text-sm"><span className="text-muted-foreground">Subtotal inspeksi </span><Money value={price.inspectionTotal} className="font-bold text-primary" /></div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {checklist.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {selections[item.id] ? <Money value={item.prices[selections[item.id]]} className="text-sm font-semibold text-primary" /> : <span className="text-xs text-red-500">Belum dipilih</span>}
                  </div>
                  <LevelChecklist item={item} value={selections[item.id]} onChange={(value) => setSelections((current) => ({ ...current, [item.id]: value }))} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">Catatan Kondisi</Label>
                <Textarea value={visualNotes} onChange={(event) => setVisualNotes(event.target.value)} placeholder="Baret, penyok, kaca retak, aksesori longgar, dan lainnya (opsional)" rows={2} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-semibold">Foto Awal <span className="font-normal text-muted-foreground">(opsional)</span></Label>
                <Button type="button" variant="secondary" onClick={() => document.getElementById('initial-photo-input')?.click()}><ImagePlus className="mr-1.5 h-4 w-4" /> Tambah Foto</Button>
                <input id="initial-photo-input" type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onPhotos} />
              </div>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={`${photo.slice(0, 24)}-${index}`} className="relative">
                      <img src={photo} alt={`Kondisi awal ${index + 1}`} className="h-20 w-28 rounded-md border object-cover" />
                      <button type="button" aria-label={`Hapus foto ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 text-sm font-semibold">Rincian Estimasi Cuci Reguler</div>
              <div className="space-y-2 text-sm">
                {price.inspectionItems.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{item.label} · <span className="capitalize">{item.severity}</span></span>
                    <Money value={item.price} />
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold"><span>Subtotal inspeksi</span><Money value={price.inspectionTotal} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-1 text-sm font-semibold">Tawarkan Layanan Tambahan</div>
              <div className="mb-3 text-xs text-muted-foreground">Pilih setelah memperlihatkan estimasi inspeksi kepada pemilik.</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ADDONS.map((addon) => (
                  <label key={addon.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted">
                    <Checkbox checked={form.addonIds.includes(addon.id)} onCheckedChange={() => toggleAddon(addon.id)} />
                    <span className="flex-1 text-sm font-medium">{addon.name}</span>
                    <Money value={db.addonPrices[addon.id]} className="text-sm text-muted-foreground" />
                  </label>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal inspeksi</span><Money value={price.inspectionTotal} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Layanan tambahan</span><Money value={price.addonTotal} /></div>
                <div className="flex justify-between pt-1 text-lg font-bold"><span>Total estimasi</span><Money value={price.total} className="text-primary" /></div>
              </div>
            </CardContent>
          </Card>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4">
            <Checkbox checked={approved} onCheckedChange={(checked) => setApproved(checked === true)} className="mt-0.5" />
            <span className="text-sm font-medium">Pemilik kendaraan menyetujui rincian pekerjaan dan total estimasi di atas</span>
          </label>

          {approved && (
            <Card className="border-primary/30">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary"><UserRound className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-semibold">{found ? 'Konfirmasi Data Pelanggan' : 'Data Pelanggan Baru'}</div>
                    <div className="text-xs text-muted-foreground">{found ? 'Pastikan nama dan nomor WhatsApp masih benar.' : 'Isi setelah pemilik menyetujui estimasi.'}</div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label className="mb-1.5 block">Nama Pelanggan <span className="text-red-500">*</span></Label><Input value={form.customerName} onChange={(event) => set('customerName', event.target.value)} placeholder="Nama pelanggan" /></div>
                  <div><Label className="mb-1.5 block">Nomor WhatsApp <span className="text-red-500">*</span></Label><Input inputMode="tel" value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} placeholder="08xx" /></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            {step > 0 ? <div className="text-sm"><span className="text-muted-foreground">Estimasi </span><span className="text-lg font-bold text-primary">{rupiah(price.total)}</span></div> : <span className="text-sm text-muted-foreground">Langkah {step + 1} dari 3</span>}
          </div>
          <div className="flex gap-2">
            {step > 0 ? <Button variant="outline" onClick={() => setStep((current) => current - 1)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali</Button> : <Button variant="outline" onClick={() => navigate('dashboard')}>Batal</Button>}
            {step < 2 ? <Button onClick={next}>Lanjutkan <ArrowRight className="ml-1.5 h-4 w-4" /></Button> : <Button onClick={submit} disabled={!approved} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Buat Order</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
