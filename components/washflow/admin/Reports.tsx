'use client';

import React, { useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { WORK_STATUS_FLOW, WORK_STATUS_META, PAYMENT_STATUS_FLOW, PAYMENT_STATUS_META, PAYMENT_METHODS } from '@/lib/washflow/constants';
import { dayKey, rupiah, formatDate, vehicleLabel } from '@/lib/washflow/format';
import { StatCard, PageHeader, StatusBadge, PaymentStatusBadge, Money, EmptyState } from '../ui';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Car, ClipboardCheck, Percent } from 'lucide-react';

function daysAgoIso(n) { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d.toISOString()); }

export default function Reports() {
  const { db, getVehicle, getPayment } = useWashflow();
  const [from, setFrom] = useState(daysAgoIso(6));
  const [to, setTo] = useState(daysAgoIso(0));
  const [cat, setCat] = useState('all');
  const [workStatus, setWorkStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [method, setMethod] = useState('all');

  const filtered = useMemo(() => db.orders.filter((o) => {
    const k = dayKey(o.createdAt);
    if (k < from || k > to) return false;
    if (cat !== 'all' && o.categoryId !== cat) return false;
    if (workStatus !== 'all' && o.workStatus !== workStatus) return false;
    if (paymentStatus !== 'all' && o.paymentStatus !== paymentStatus) return false;
    if (method !== 'all') {
      const p = o.paymentId ? getPayment(o.paymentId) : null;
      if (!p || p.method !== method) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [db, from, to, cat, workStatus, paymentStatus, method, getPayment]);

  const summary = useMemo(() => {
    let omzet = 0; let diskon = 0; const pointCount: Record<string, number> = {};
    filtered.forEach((o) => {
      const p = o.paymentId ? getPayment(o.paymentId) : null;
      if (p) { omzet += p.total; diskon += p.discount; }
      (o.priceSnapshot?.inspectionItems || []).forEach((item) => {
        pointCount[item.label] = (pointCount[item.label] || 0) + 1;
      });
    });
    const topPoint = Object.keys(pointCount).sort((a, b) => pointCount[b] - pointCount[a])[0];
    return { omzet, diskon, count: filtered.length, topPoint };
  }, [filtered, getPayment]);

  const selectCls = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div>
      <PageHeader title="Laporan" desc="Analisis transaksi dengan filter lengkap" />
      <Card className="mb-4"><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div><Label className="mb-1 block text-xs">Dari</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label className="mb-1 block text-xs">Sampai</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><Label className="mb-1 block text-xs">Kategori</Label><select className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">Semua</option>{db.vehicleCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><Label className="mb-1 block text-xs">Pengerjaan</Label><select className={selectCls} value={workStatus} onChange={(e) => setWorkStatus(e.target.value)}><option value="all">Semua</option>{WORK_STATUS_FLOW.map((s) => <option key={s} value={s}>{WORK_STATUS_META[s].label}</option>)}</select></div>
        <div><Label className="mb-1 block text-xs">Pembayaran</Label><select className={selectCls} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><option value="all">Semua</option>{PAYMENT_STATUS_FLOW.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_META[s].label}</option>)}</select></div>
        <div><Label className="mb-1 block text-xs">Metode</Label><select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}><option value="all">Semua</option>{PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      </CardContent></Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Total Omzet" value={<Money value={summary.omzet} />} tone="green" />
        <StatCard icon={Car} label="Jumlah Kendaraan" value={summary.count} tone="sky" />
        <StatCard icon={ClipboardCheck} label="Poin Terbanyak" value={summary.topPoint || '-'} tone="cyan" />
        <StatCard icon={Percent} label="Total Diskon" value={<Money value={summary.diskon} />} tone="orange" />
      </div>

      <Card className="mt-4"><CardContent className="p-0">
          {filtered.length === 0 ? <div className="p-6"><EmptyState title="Tidak ada data" desc="Sesuaikan filter untuk melihat transaksi." /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Kendaraan</TableHead><TableHead>Inspeksi</TableHead><TableHead>Pengerjaan</TableHead><TableHead>Pembayaran</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((o) => { const v = getVehicle(o.vehicleId); return (
                    <TableRow key={o.id}>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell>{vehicleLabel(v)}</TableCell>
                      <TableCell>{o.inspectionItems?.length || 0} poin</TableCell>
                      <TableCell><StatusBadge status={o.workStatus} /></TableCell>
                      <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                      <TableCell className="text-right font-semibold"><Money value={o.priceSnapshot?.total} /></TableCell>
                    </TableRow>
                  ); })}
                </TableBody>
              </Table>
            </div>
          )}
      </CardContent></Card>
    </div>
  );
}
