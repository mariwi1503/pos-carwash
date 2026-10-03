'use client';

import React, { useMemo } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { PAYMENT_METHODS } from '@/lib/washflow/constants';
import { isToday, formatTime, vehicleLabel } from '@/lib/washflow/format';
import { StatCard, PageHeader, Money, EmptyState } from '../ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Receipt as ReceiptIcon, CreditCard, Clock } from 'lucide-react';

export default function KasirDashboard({ navigate }) {
  const { db, getVehicle, getVehicleCategory } = useWashflow();
  const todayPayments = useMemo(() => db.payments.filter((p) => isToday(p.createdAt)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [db]);
  const unpaid = useMemo(() => db.orders.filter((o) => o.paymentStatus !== 'dibayar').length, [db]);
  const totalToday = todayPayments.reduce((s, p) => s + p.total, 0);
  const byMethod = useMemo(() => {
    const m: Record<string, number> = {};
    PAYMENT_METHODS.forEach((x) => { m[x.id] = 0; });
    todayPayments.forEach((p) => { m[p.method] = (m[p.method] || 0) + p.total; });
    return m;
  }, [todayPayments]);

  return (
    <div>
      <PageHeader
        title="Dashboard Kasir"
        desc="Ringkasan pembayaran hari ini"
        action={<Button size="lg" onClick={() => navigate('pembayaran')}><CreditCard className="h-4 w-4" /> Bayar Order</Button>}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Pembayaran Hari Ini" value={<Money value={totalToday} />} tone="green" />
        <StatCard icon={ReceiptIcon} label="Transaksi Selesai" value={todayPayments.length} tone="sky" />
        <StatCard icon={Clock} label="Belum Dibayar" value={unpaid} tone="orange" />
        <StatCard icon={CreditCard} label="Metode Terbanyak" value={PAYMENT_METHODS.find((m) => m.id === Object.keys(byMethod).sort((a, b) => byMethod[b] - byMethod[a])[0])?.name || '-'} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PAYMENT_METHODS.map((m) => (
          <Card key={m.id}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{m.name}</div><div className="mt-1 text-base font-bold"><Money value={byMethod[m.id]} /></div></CardContent></Card>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-base font-semibold">Riwayat Pembayaran Hari Ini</h2>
      {todayPayments.length === 0 ? (
        <EmptyState icon={ReceiptIcon} title="Belum ada pembayaran hari ini" />
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Invoice</TableHead><TableHead>Kendaraan</TableHead><TableHead>Metode</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {todayPayments.map((p) => {
                  const o = db.orders.find((x) => x.id === p.orderId);
                  const v = getVehicle(o?.vehicleId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{formatTime(p.createdAt)}</TableCell>
                      <TableCell className="font-medium">{p.invoiceNo}</TableCell>
                      <TableCell>{vehicleLabel(v)} · {getVehicleCategory(o?.categoryId)?.name}</TableCell>
                      <TableCell className="uppercase">{p.method}</TableCell>
                      <TableCell className="text-right font-semibold"><Money value={p.total} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
