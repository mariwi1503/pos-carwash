'use client';

import React, { useMemo } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { WORK_STATUS_FLOW, isOrderClosed } from '@/lib/washflow/constants';
import { isToday, waitingSince, vehicleLabel } from '@/lib/washflow/format';
import { StatCard, PageHeader, StatusBadge, PaymentStatusBadge, Money, EmptyState } from '../ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Car, Clock, Droplets, CheckCircle2, ListChecks } from 'lucide-react';

export default function OperatorDashboard({ navigate }) {
  const { db, getVehicleCategory } = useWashflow();
  const active = useMemo(() => db.orders.filter((o) => !isOrderClosed(o)), [db]);
  const todayCount = useMemo(() => db.orders.filter((o) => isToday(o.createdAt)).length, [db]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    WORK_STATUS_FLOW.forEach((s) => { c[s] = 0; });
    active.forEach((o) => { c[o.workStatus] = (c[o.workStatus] || 0) + 1; });
    return c;
  }, [active]);
  const inProcess = counts.dicuci + counts.finishing;

  return (
    <div>
      <PageHeader
        title="Dashboard Antrean"
        desc="Pantau kendaraan yang sedang diproses hari ini"
        action={<Button size="lg" onClick={() => navigate('terima')}><Plus className="mr-2 h-5 w-5" /> Terima Kendaraan</Button>}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Car} label="Kendaraan Hari Ini" value={todayCount} tone="sky" />
        <StatCard icon={Clock} label="Menunggu" value={counts.menunggu} tone="slate" />
        <StatCard icon={Droplets} label="Sedang Diproses" value={inProcess} tone="cyan" />
        <StatCard icon={CheckCircle2} label="Selesai" value={counts.selesai} tone="emerald" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-semibold">Antrean Aktif</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('antrean')}>Lihat Board <ListChecks className="ml-1.5 h-4 w-4" /></Button>
      </div>
      <div className="mt-3 space-y-3">
        {active.length === 0 ? (
          <EmptyState icon={Car} title="Belum ada antrean aktif" desc="Mulai dengan menerima kendaraan baru." action={<Button onClick={() => navigate('terima')}><Plus className="mr-2 h-4 w-4" /> Terima Kendaraan</Button>} />
        ) : active.slice(0, 6).map((o) => {
          const v = db.vehicles.find((x) => x.id === o.vehicleId);
          return (
            <Card key={o.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">#{o.queueNo}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{vehicleLabel(v)}</div>
                  <div className="truncate text-xs text-muted-foreground">{getVehicleCategory(o.categoryId)?.name} · {o.inspectionItems?.length || 0} poin · status berjalan {waitingSince(o.workStatusHistory[o.workStatusHistory.length - 1]?.at)}</div>
                </div>
                <Money value={o.priceSnapshot?.total} className="font-semibold" />
                <div className="flex flex-wrap gap-1.5"><StatusBadge status={o.workStatus} /><PaymentStatusBadge status={o.paymentStatus} /></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
