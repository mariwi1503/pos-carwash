'use client';

import React, { useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { ROLES } from '@/lib/washflow/constants';
import { formatDateFull } from '@/lib/washflow/format';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Droplets, LayoutDashboard, PlusCircle, ListChecks, FileBarChart, Tags, Store, Users as UsersIcon, CarFront,
  CreditCard, RotateCcw, LogOut, Calendar,
} from 'lucide-react';

import OperatorDashboard from './operator/OperatorDashboard';
import ReceiveVehicle from './operator/ReceiveVehicle';
import QueueBoard from './operator/QueueBoard';
import KasirDashboard from './kasir/KasirDashboard';
import PaymentScreen from './kasir/PaymentScreen';
import AdminDashboard from './admin/AdminDashboard';
import Reports from './admin/Reports';
import MasterPricing from './admin/MasterPricing';
import Settings from './admin/Settings';
import Users from './admin/Users';
import VehicleTypes from './admin/VehicleTypes';

const MENUS = {
  operator: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, C: OperatorDashboard },
    { id: 'terima', label: 'Terima Kendaraan', icon: PlusCircle, C: ReceiveVehicle, hidden: true },
    { id: 'antrean', label: 'Board Antrean', icon: ListChecks, C: QueueBoard },
  ],
  kasir: [
    { id: 'dashboard', label: 'Dashboard Kasir', icon: LayoutDashboard, C: KasirDashboard },
    { id: 'pembayaran', label: 'Daftar Pembayaran', icon: CreditCard, C: PaymentScreen },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, C: AdminDashboard },
    { id: 'laporan', label: 'Laporan', icon: FileBarChart, C: Reports },
    { id: 'vehicle-types', label: 'Tipe Kendaraan', icon: CarFront, C: VehicleTypes },
    { id: 'master', label: 'Master Inspeksi', icon: Tags, C: MasterPricing },
    { id: 'outlet', label: 'Pengaturan', icon: Store, C: Settings },
    { id: 'users', label: 'Akun Role', icon: UsersIcon, C: Users },
  ],
};

function ResetButton({ full }) {
  const { resetDemo } = useWashflow();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={full ? 'default' : 'sm'} className={full ? 'w-full justify-start text-red-600 hover:text-red-700' : 'text-red-600'}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Data Demo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Data Demo?</AlertDialogTitle>
          <AlertDialogDescription>Semua perubahan akan dihapus dan data dikembalikan ke kondisi awal demo. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { resetDemo(); toast.success('Data demo berhasil direset'); }}>Ya, Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Shell() {
  const { session, logout, db } = useWashflow();
  const role = session.role;
  const menu = MENUS[role] || [];
  const [view, setView] = useState('dashboard');
  const navigate = (id) => setView(id);
  const current = menu.find((m) => m.id === view) || menu[0];
  const Screen = current.C;
  const today = formatDateFull(new Date().toISOString());

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Droplets className="h-5 w-5" /></div>
          <span className="text-base font-bold">WashFlow</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {menu.filter((m) => !m.hidden).map((m) => (
            <button key={m.id} onClick={() => navigate(m.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${view === m.id ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-muted'}`}>
              <m.icon className="h-4.5 w-4.5" /> {m.label}
            </button>
          ))}
        </nav>
        {role === 'admin' ? <div className="border-t p-3"><ResetButton full /></div> : null}
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Droplets className="h-5 w-5" /></div>
            <span className="text-base font-bold">WashFlow Carwash</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><Calendar className="h-4 w-4" /> {today}</div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline">{ROLES[role]?.label} · {session.name}</span>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-1.5 h-4 w-4" /> Ganti Role</Button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:px-6 lg:pb-8">
          <Screen navigate={navigate} />
          {role === 'admin' ? <div className="mt-6 lg:hidden"><ResetButton full /></div> : null}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden">
        {menu.filter((m) => !m.hidden).map((m) => (
          <button key={m.id} onClick={() => navigate(m.id)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${view === m.id ? 'text-primary' : 'text-muted-foreground'}`}>
            <m.icon className="h-5 w-5" />
            <span className="max-w-full truncate px-1">{m.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
