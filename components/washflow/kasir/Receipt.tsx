'use client';

import React from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { PAYMENT_METHODS } from '@/lib/washflow/constants';
import { formatDateTime, rupiah, vehicleLabel } from '@/lib/washflow/format';
import { Separator } from '@/components/ui/separator';
import { Droplets } from 'lucide-react';

export default function Receipt({ order, payment }) {
  const { db, getVehicle, getCustomer, getVehicleCategory } = useWashflow();
  if (!order || !payment) return null;
  const outlet = db.outlet;
  const vehicle = getVehicle(order.vehicleId);
  const customer = getCustomer(order.customerId);
  const cat = getVehicleCategory(order.categoryId);
  const snap = order.priceSnapshot;
  const method = PAYMENT_METHODS.find((m) => m.id === payment.method)?.name;

  return (
    <div className="print-area mx-auto w-full max-w-sm rounded-lg border bg-white p-5 text-sm text-slate-800">
      <div className="mb-3 text-center">
        <div className="mb-1 flex items-center justify-center gap-1.5 font-bold text-sky-700"><Droplets className="h-5 w-5" /> {outlet.name}</div>
        <div className="text-xs text-slate-500">{outlet.address}</div>
        <div className="text-xs text-slate-500">{outlet.phone}</div>
      </div>
      <Separator />
      <div className="my-2 space-y-0.5 text-xs">
        <div className="flex justify-between"><span>No. Invoice</span><span className="font-semibold">{payment.invoiceNo}</span></div>
        <div className="flex justify-between"><span>Tanggal</span><span>{formatDateTime(payment.createdAt)}</span></div>
        <div className="flex justify-between"><span>Pelanggan</span><span>{customer?.name}</span></div>
        <div className="flex justify-between"><span>Kendaraan</span><span>{vehicleLabel(vehicle)} · {cat?.name}</span></div>
      </div>
      <Separator />
      <div className="my-2 space-y-1">
        {snap.inspectionItems.map((item) => (
          <div key={item.itemId} className="flex justify-between gap-3">
            <span>{item.label} · {item.severity}</span><span>{rupiah(item.price)}</span>
          </div>
        ))}
        {snap.addonItems.map((a) => (<div key={a.id} className="flex justify-between text-slate-600"><span>+ {a.name}</span><span>{rupiah(a.price)}</span></div>))}
      </div>
      <Separator />
      <div className="my-2 space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span>{rupiah(snap.subtotal)}</span></div>
        {payment.discount > 0 ? <div className="flex justify-between text-emerald-700"><span>Diskon</span><span>- {rupiah(payment.discount)}</span></div> : null}
        <div className="flex justify-between text-base font-bold"><span>Total</span><span>{rupiah(snap.total)}</span></div>
        <div className="flex justify-between"><span>Metode</span><span className="font-semibold">{method}</span></div>
      </div>
      <Separator />
      <p className="mt-3 text-center text-xs text-slate-500">{outlet.footer}</p>
    </div>
  );
}
