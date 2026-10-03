'use client';

import React, { useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { DEMO_IMAGES } from '@/lib/washflow/seed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  ArrowRight,
  Droplets,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react';

const DEMO_ROLES = [
  { role: 'admin', label: 'Admin' },
  { role: 'operator', label: 'Operator' },
  { role: 'kasir', label: 'Kasir' },
];

export default function Login() {
  const { db, login } = useWashflow();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemoRole, setSelectedDemoRole] = useState('');

  const fillDemoAccount = (account) => {
    setIdentifier(account.username);
    setPassword(account.password);
    setSelectedDemoRole(account.role);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login(identifier, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 lg:grid lg:grid-cols-2">
      {/* Hero */}
      <div className="relative hidden lg:block">
        <img src={DEMO_IMAGES.hero} alt="Car wash" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/90 via-sky-700/70 to-cyan-500/60" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Droplets className="h-6 w-6" /></div>
            <span className="text-lg font-bold">WashFlow Carwash</span>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-extrabold leading-tight">Sistem POS & Administrasi Carwash modern.</h1>
            <p className="mt-4 max-w-md text-sky-100">Kelola penerimaan kendaraan, inspeksi, antrean cuci, pembayaran, hingga laporan omzet — dalam satu aplikasi.</p>
          </div>
          <p className="text-sm text-sky-200">Demo interaktif · data tersimpan di perangkat Anda</p>
        </div>
      </div>

      {/* Login form */}
      <div className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-background to-cyan-50 px-4 py-6 sm:px-8 sm:py-10 lg:bg-background lg:p-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl lg:hidden" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl lg:hidden" />

        <div className="relative w-full max-w-md">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sky-500/25"><Droplets className="h-6 w-6" /></div>
            <div>
              <div className="text-lg font-extrabold leading-tight text-foreground">WashFlow</div>
              <div className="text-xs text-muted-foreground">Carwash Management</div>
            </div>
          </div>

          <Card className="border-white/80 bg-card/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8 lg:border-border">
            <div className="mb-6 text-center sm:text-left">
              <div className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Portal operasional
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Selamat datang kembali</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Masuk menggunakan email atau username untuk mengakses WashFlow.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email atau username</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan email atau username"
                    value={identifier}
                    onChange={(event) => { setIdentifier(event.target.value); setSelectedDemoRole(''); setError(''); }}
                    className="h-12 rounded-xl border-slate-200 bg-background/80 pl-10 shadow-none transition-shadow focus-visible:ring-2"
                    aria-invalid={Boolean(error)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setSelectedDemoRole(''); setError(''); }}
                    className="h-12 rounded-xl border-slate-200 bg-background/80 px-10 shadow-none transition-shadow focus-visible:ring-2"
                    aria-invalid={Boolean(error)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20">
                Masuk ke WashFlow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Akun demo</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-3 gap-2" aria-label="Pilihan akun demo">
              {DEMO_ROLES.map((demoRole) => {
                const account = db.users.find((item) => item.role === demoRole.role && item.active !== false);
                const selected = selectedDemoRole === demoRole.role;
                return (
                  <button
                    key={demoRole.role}
                    type="button"
                    onClick={() => account && fillDemoAccount(account)}
                    disabled={!account}
                    className={`h-11 rounded-xl border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-sky-500/20'
                        : 'border-border bg-background text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40'
                    }`}
                    aria-pressed={selected}
                    aria-label={`Isi otomatis akun demo ${demoRole.label}`}
                  >
                    {demoRole.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">Pilih role untuk mengisi data login secara otomatis.</p>
          </Card>

          <p className="mt-5 text-center text-xs text-slate-500 lg:text-muted-foreground">Demo interaktif · data tersimpan di perangkat Anda</p>
        </div>
      </div>
    </div>
  );
}
