'use client';

import React, { useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { ROLES } from '@/lib/washflow/constants';
import { PageHeader } from '../ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ShieldCheck, Wrench, Receipt, Plus, Pencil, Trash2, Mail, AtSign } from 'lucide-react';

const ICONS = { admin: ShieldCheck, operator: Wrench, kasir: Receipt };
const EMPTY_FORM = {
  name: '', username: '', email: '', password: '', role: 'operator', active: true,
};

export default function Users() {
  const { db, session, createUser, updateUser, deleteUser } = useWashflow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const activeAdminCount = useMemo(() => db.users.filter((user) => user.role === 'admin' && user.active !== false).length, [db.users]);
  const users = useMemo(() => db.users.slice().sort((a, b) => {
    if ((a.active !== false) !== (b.active !== false)) return a.active === false ? 1 : -1;
    return a.name.localeCompare(b.name, 'id');
  }), [db.users]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      active: user.active !== false,
    });
    setError('');
    setDialogOpen(true);
  };

  const validate = () => {
    const name = form.name.trim();
    const username = form.username.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();
    if (!name || !username || !email || !form.role) return 'Nama, username, email, dan role wajib diisi.';
    if (!/^[a-z0-9._-]+$/.test(username)) return 'Username hanya boleh menggunakan huruf kecil, angka, titik, garis bawah, atau tanda hubung.';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Format email belum benar.';
    if (!editingId && !form.password) return 'Password wajib diisi untuk pengguna baru.';
    if (form.password && form.password.length < 6) return 'Password minimal 6 karakter.';
    const duplicateUsername = db.users.some((user) => user.id !== editingId && user.username?.toLowerCase() === username);
    if (duplicateUsername) return 'Username sudah digunakan pengguna lain.';
    const duplicateEmail = db.users.some((user) => user.id !== editingId && user.email?.toLowerCase() === email);
    if (duplicateEmail) return 'Email sudah digunakan pengguna lain.';
    return '';
  };

  const submit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      active: form.active,
    };
    if (editingId) {
      updateUser(editingId, form.password ? { ...payload, password: form.password } : payload);
      toast.success('Pengguna berhasil diperbarui');
    } else {
      createUser({ ...payload, password: form.password });
      toast.success('Pengguna berhasil ditambahkan');
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    toast.success('Pengguna berhasil dihapus');
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        desc="Kelola akun, kredensial login, role, dan status pengguna"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Pengguna</Button>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.values(ROLES).map((role) => (
          <Card key={role.id}>
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground">{role.label}</div>
              <div className="mt-1 text-2xl font-bold">{db.users.filter((user) => user.role === role.id).length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const Icon = ICONS[user.role] || ShieldCheck;
          const isCurrentUser = user.id === session.userId;
          const isLastActiveAdmin = user.role === 'admin' && user.active !== false && activeAdminCount <= 1;
          const deleteDisabled = isCurrentUser || isLastActiveAdmin;
          return (
            <Card key={user.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{user.initial}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{user.name}</span>
                      {isCurrentUser ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Akun Anda</span> : null}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${user.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.active !== false ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {ROLES[user.role]?.label}</span>
                      <span className="flex items-center gap-1"><AtSign className="h-3.5 w-3.5" /> {user.username}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleteDisabled}
                    title={isCurrentUser ? 'Akun yang sedang digunakan tidak dapat dihapus' : isLastActiveAdmin ? 'Admin aktif terakhir tidak dapat dihapus' : 'Hapus pengguna'}
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(user)}
                  ><Trash2 className="h-3.5 w-3.5" /> Hapus</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setError(''); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
              <DialogDescription>{editingId ? 'Perbarui identitas, kredensial, role, atau status pengguna.' : 'Buat akun baru yang dapat langsung digunakan untuk login.'}</DialogDescription>
            </DialogHeader>

            <div className="my-5 space-y-4">
              <div>
                <Label htmlFor="user-name" className="mb-1.5 block">Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input id="user-name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Nama pengguna" autoFocus />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="user-username" className="mb-1.5 block">Username <span className="text-red-500">*</span></Label>
                  <Input id="user-username" value={form.username} onChange={(event) => set('username', event.target.value.toLowerCase())} placeholder="username" autoCapitalize="none" />
                </div>
                <div>
                  <Label htmlFor="user-email" className="mb-1.5 block">Email <span className="text-red-500">*</span></Label>
                  <Input id="user-email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="nama@washflow.id" />
                </div>
              </div>
              <div>
                <Label htmlFor="user-password" className="mb-1.5 block">Password {!editingId ? <span className="text-red-500">*</span> : <span className="font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span>}</Label>
                <Input id="user-password" type="password" value={form.password} onChange={(event) => set('password', event.target.value)} placeholder={editingId ? 'Tidak diubah' : 'Minimal 6 karakter'} autoComplete="new-password" />
              </div>
              <div>
                <Label htmlFor="user-role" className="mb-1.5 block">Role <span className="text-red-500">*</span></Label>
                <select
                  id="user-role"
                  value={form.role}
                  disabled={editingId === session.userId}
                  onChange={(event) => set('role', event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {Object.values(ROLES).map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                </select>
                {editingId === session.userId ? <p className="mt-1 text-xs text-muted-foreground">Role akun yang sedang digunakan tidak dapat diubah.</p> : null}
              </div>
              <label className={`flex items-center gap-3 rounded-lg border p-3 ${editingId === session.userId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <Checkbox checked={form.active} disabled={editingId === session.userId} onCheckedChange={(checked) => set('active', checked === true)} />
                <span className="text-sm font-medium">Akun aktif dan dapat digunakan untuk login</span>
              </label>
              {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
            <AlertDialogDescription>Akun {deleteTarget?.name} akan dihapus dan tidak dapat digunakan untuk login. Riwayat transaksi yang telah dibuat tetap tersimpan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
