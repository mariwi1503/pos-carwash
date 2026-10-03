'use client';

import React, { useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { isToday, dayKey, rupiah, rupiahShort, formatDate, formatTime, vehicleLabel } from '@/lib/washflow/format';
import { StatCard, PageHeader, StatusBadge, Money, EmptyState } from '../ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, Car, Droplets, CheckCircle2, Search, History } from 'lucide-react';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function AdminDashboard() {
  const { db, findVehicleByPlate, vehicleHistory, getVehicle, getVehicleCategory } = useWashflow();
  const [plate, setPlate] = useState('');
  const [history, setHistory] = useState(null);

  const omzetToday = useMemo(() => db.payments.filter((p) => isToday(p.createdAt)).reduce((s, p) => s + p.total, 0), [db]);
  const vehiclesToday = useMemo(() => db.orders.filter((o) => isToday(o.createdAt)).length, [db]);
  const inProcess = useMemo(() => db.orders.filter((o) => ['dicuci', 'finishing'].includes(o.workStatus)).length, [db]);
  const doneToday = useMemo(() => db.payments.filter((p) => isToday(p.createdAt)).length, [db]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = dayKey(d.toISOString());
      const total = db.payments.filter((p) => dayKey(p.createdAt) === key).reduce((s, p) => s + p.total, 0);
      days.push({ label: DOW[d.getDay()], total });
    }
    return days;
  }, [db]);

  const recent = useMemo(() => db.payments.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8), [db]);

  const searchHistory = () => {
    const v = findVehicleByPlate(plate);
    if (!v) { setHistory({ notFound: true }); return; }
    setHistory({ vehicle: v, orders: vehicleHistory(v.id) });
  };

  return (
    <div>
      <PageHeader title="Dashboard" desc="Ringkasan performa outlet hari ini" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Omzet Hari Ini" value={<Money value={omzetToday} />} tone="green" />
        <StatCard icon={Car} label="Kendaraan Hari Ini" value={vehiclesToday} tone="sky" />
        <StatCard icon={Droplets} label="Sedang Diproses" value={inProcess} tone="cyan" />
        <StatCard icon={CheckCircle2} label="Transaksi Selesai" value={doneToday} tone="emerald" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Omzet 7 Hari Terakhir</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 4 }}>
                  <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.35} /><stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => rupiahShort(v)} tickLine={false} axisLine={false} fontSize={11} width={56} />
                  <Tooltip formatter={(v) => rupiah(v)} labelClassName="text-sm" />
                  <Area type="monotone" dataKey="total" stroke="hsl(199 89% 48%)" strokeWidth={2.5} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Riwayat Kendaraan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Nomor polisi" className="uppercase" onKeyDown={(e) => e.key === 'Enter' && searchHistory()} />
              <button onClick={searchHistory} className="flex items-center justify-center rounded-md bg-primary px-3 text-primary-foreground"><Search className="h-4 w-4" /></button>
            </div>
            <div className="mt-3">
              {history?.notFound && <p className="text-sm text-muted-foreground">Kendaraan tidak ditemukan.</p>}
              {history?.vehicle && (
                <div>
                  <p className="text-sm font-semibold">{vehicleLabel(history.vehicle)} · {history.vehicle.brand}</p>
                  <p className="mb-2 text-xs text-muted-foreground">{history.orders.length} kunjungan</p>
                  <ul className="space-y-1.5">
                    {history.orders.slice(0, 6).map((o) => (
                      <li key={o.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                        <span>{formatDate(o.createdAt)} · {o.inspectionItems?.length || 0} poin inspeksi</span>
                        <span className="font-semibold">{rupiah(o.priceSnapshot?.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!history && <p className="text-sm text-muted-foreground">Cari berdasarkan nomor polisi untuk melihat riwayat kunjungan.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Transaksi Terbaru</CardTitle></CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? <div className="p-6"><EmptyState title="Belum ada transaksi" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Tanggal</TableHead><TableHead>Kendaraan</TableHead><TableHead>Metode</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recent.map((p) => {
                    const o = db.orders.find((x) => x.id === p.orderId); const v = getVehicle(o?.vehicleId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.invoiceNo}</TableCell>
                        <TableCell>{formatDate(p.createdAt)} {formatTime(p.createdAt)}</TableCell>
                        <TableCell>{vehicleLabel(v)} · {getVehicleCategory(o?.categoryId)?.name}</TableCell>
                        <TableCell className="uppercase">{p.method}</TableCell>
                        <TableCell className="text-right font-semibold"><Money value={p.total} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
