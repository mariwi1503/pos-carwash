'use client';

import React from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { formatDateTime, vehicleLabel } from '@/lib/washflow/format';
import { WORK_STATUS_META, PAYMENT_STATUS_META } from '@/lib/washflow/constants';
import { DirtBadge, Money, StatusBadge, PaymentStatusBadge } from './ui';
import { Separator } from '@/components/ui/separator';
import { Car, User, ClipboardCheck, Receipt } from 'lucide-react';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

export default function OrderDetailBody({ order }) {
  const { getVehicle, getCustomer, getVehicleCategory, getInspection } = useWashflow();
  if (!order) return null;
  const vehicle = getVehicle(order.vehicleId);
  const customer = getCustomer(order.customerId);
  const insp = getInspection(order.inspectionId);
  const cat = getVehicleCategory(order.categoryId);
  const snap = order.priceSnapshot || {};

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Car className="h-4 w-4 text-primary" /> Kendaraan</div>
          <Row label="Nomor Polisi">{vehicleLabel(vehicle)}</Row>
          <Row label="Kategori">{cat?.name}</Row>
          <Row label="Merek / Model">{vehicle?.brand || '-'}</Row>
          <Row label="Warna">{vehicle?.color || '-'}</Row>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4 text-primary" /> Pelanggan</div>
          <Row label="Nama">{customer?.name || '-'}</Row>
          <Row label="WhatsApp">{customer?.whatsapp || '-'}</Row>
          <Row label="No. Order">{order.orderNo}</Row>
          <Row label="No. Antrean">#{order.queueNo}</Row>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"><span className="text-muted-foreground">Status pengerjaan</span><StatusBadge status={order.workStatus} /></div>
        <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"><span className="text-muted-foreground">Status pembayaran</span><PaymentStatusBadge status={order.paymentStatus} /></div>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="h-4 w-4 text-primary" /> Hasil Inspeksi Awal</div>
        <div className="space-y-1.5">
          {(snap.inspectionItems || insp?.items || []).map((item) => (
            <div key={item.itemId} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2"><span>{item.label}</span><DirtBadge level={item.severity} /></span>
              <Money value={item.price} className="font-medium" />
            </div>
          ))}
        </div>
        {insp?.visualNotes ? <p className="mt-2 text-sm text-foreground">Catatan visual: {insp.visualNotes}</p> : null}
        {order.operatorNote ? <p className="mt-1 text-sm text-muted-foreground">Catatan operator: {order.operatorNote}</p> : null}
        {(order.photosBefore?.length || 0) > 0 ? (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Foto kondisi awal</div>
            <div className="flex flex-wrap gap-2">
              {order.photosBefore.map((p, i) => (
                <img key={i} src={p} alt="before" className="h-20 w-28 rounded-md border object-cover" />
              ))}
            </div>
          </div>
        ) : null}
        {order.resultNote ? <p className="mt-2 text-sm text-emerald-700">Hasil cuci: {order.resultNote}</p> : null}
        {(order.photosAfter?.length || 0) > 0 ? (
          <div className="mt-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Foto sesudah</div>
            <div className="flex flex-wrap gap-2">
              {order.photosAfter.map((p, i) => (
                <img key={i} src={p} alt="after" className="h-20 w-28 rounded-md border object-cover" />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4 text-primary" /> Rincian Harga</div>
        {(snap.inspectionItems || []).map((item) => (<Row key={item.itemId} label={`${item.label} · ${item.severity}`}><Money value={item.price} /></Row>))}
        <Separator className="my-2" />
        <Row label={`Subtotal inspeksi (${cat?.name})`}><Money value={snap.inspectionTotal} /></Row>
        {(snap.addonItems || []).map((a) => (<Row key={a.id} label={`+ ${a.name}`}><Money value={a.price} /></Row>))}
        <Separator className="my-2" />
        <Row label="Subtotal"><Money value={snap.subtotal} /></Row>
        {snap.discount > 0 ? <Row label="Diskon"><span className="text-emerald-600">- <Money value={snap.discount} /></span></Row> : null}
        <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><Money value={snap.total} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Riwayat Pengerjaan</div>
          <ol className="space-y-1.5">
            {order.workStatusHistory.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />{WORK_STATUS_META[h.status]?.label || h.status}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Riwayat Pembayaran</div>
          <ol className="space-y-1.5">
            {order.paymentStatusHistory.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />{PAYMENT_STATUS_META[h.status]?.label || h.status}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
