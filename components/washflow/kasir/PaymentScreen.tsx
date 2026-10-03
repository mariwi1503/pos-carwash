'use client';

import React, { useMemo, useState } from 'react';
import { useWashflow } from '@/lib/washflow/store';
import { PAYMENT_METHODS, DISCOUNT_LIMIT_NOMINAL, DISCOUNT_LIMIT_PERCENT } from '@/lib/washflow/constants';
import { rupiah, vehicleLabel } from '@/lib/washflow/format';
import { PageHeader, StatusBadge, PaymentStatusBadge, Money, EmptyState } from '../ui';
import OrderDetailBody from '../OrderDetail';
import Receipt from './Receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Receipt as ReceiptIcon, CreditCard, Printer, Share2, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

export default function PaymentScreen() {
  const { db, createPayment, getVehicle, getCustomer, getVehicleCategory } = useWashflow();
  const [payId, setPayId] = useState(null);
  const [method, setMethod] = useState('tunai');
  const [discType, setDiscType] = useState('nominal');
  const [discValue, setDiscValue] = useState('');
  const [receipt, setReceipt] = useState(null); // { order, payment }
  const [search, setSearch] = useState('');

  const unpaidOrders = useMemo(() => db.orders
    .filter((o) => o.paymentStatus !== 'dibayar')
    .sort((a, b) => a.queueNo - b.queueNo), [db]);

  const filteredUnpaidOrders = useMemo(() => {
    const query = search.trim().toUpperCase();
    if (!query) return unpaidOrders;
    const queueQuery = query.replace(/^#/, '');
    const plateQuery = query.replace(/\s+/g, '');
    return unpaidOrders.filter((order) => {
      const vehicle = getVehicle(order.vehicleId);
      return order.orderNo?.toUpperCase().includes(query)
        || (queueQuery && String(order.queueNo).includes(queueQuery))
        || (plateQuery && vehicle?.plate?.toUpperCase().replace(/\s+/g, '').includes(plateQuery));
    });
  }, [unpaidOrders, search, getVehicle]);

  const payOrder = db.orders.find((o) => o.id === payId);
  const subtotal = payOrder?.priceSnapshot?.subtotal || 0;
  const discNominal = useMemo(() => {
    const v = Number(discValue) || 0;
    if (discType === 'percent') return Math.round(subtotal * Math.min(v, 100) / 100);
    return v;
  }, [discValue, discType, subtotal]);
  const overLimit = discType === 'percent' ? (Number(discValue) || 0) > DISCOUNT_LIMIT_PERCENT : discNominal > DISCOUNT_LIMIT_NOMINAL;
  const total = Math.max(0, subtotal - discNominal);

  const openPay = (o) => { setPayId(o.id); setMethod('tunai'); setDiscType('nominal'); setDiscValue(''); };

  const findOrder = (event) => {
    event?.preventDefault();
    const query = search.trim().toUpperCase();
    if (!query) {
      toast.error('Masukkan nomor order, antrean, atau nomor polisi');
      return;
    }
    const queueQuery = query.replace(/^#/, '');
    const plateQuery = query.replace(/\s+/g, '');
    const matches = db.orders.filter((order) => {
      if (order.paymentStatus === 'dibayar') return false;
      const vehicle = getVehicle(order.vehicleId);
      return order.orderNo?.toUpperCase() === query
        || String(order.queueNo) === queueQuery
        || vehicle?.plate?.toUpperCase().replace(/\s+/g, '') === plateQuery;
    });
    if (matches.length === 0) {
      toast.error('Order aktif tidak ditemukan');
      return;
    }
    if (matches.length > 1) {
      toast.error('Ditemukan lebih dari satu order. Gunakan nomor order agar lebih spesifik.');
      return;
    }
    const order = matches[0];
    openPay(order);
  };

  const confirm = () => {
    if (overLimit || !payOrder || payOrder.paymentStatus === 'dibayar') return;
    const pay = createPayment(payId, { method, discount: discNominal, discountType: discType });
    if (!pay) {
      setPayId(null);
      toast.error('Order ini sudah dibayar atau tidak lagi tersedia');
      return;
    }
    const updatedOrder = {
      ...payOrder,
      paymentStatus: 'dibayar',
      paymentId: pay.id,
      discount: discNominal,
      priceSnapshot: { ...payOrder.priceSnapshot, discount: discNominal, total },
      paymentStatusHistory: [...payOrder.paymentStatusHistory, { status: 'dibayar', at: pay.createdAt }],
    };
    setPayId(null);
    setReceipt({ order: updatedOrder, payment: pay });
    toast.success('Pembayaran berhasil — status pembayaran: Dibayar');
  };

  const shareWa = () => {
    const o = receipt.order; const p = receipt.payment;
    const v = getVehicle(o.vehicleId); const c = getCustomer(o.customerId);
    const num = (c?.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62');
    const msg = `*${db.outlet.name}*%0AInvoice: ${p.invoiceNo}%0AKendaraan: ${vehicleLabel(v)} (${getVehicleCategory(o.categoryId)?.name})%0ATotal: ${rupiah(p.total)}%0AMetode: ${p.method.toUpperCase()}%0A%0ATerima kasih! 🚗✨`;
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  return (
    <div>
      <PageHeader title="Daftar Pembayaran" desc="Cari dan bayar order tanpa bergantung pada status pengerjaan kendaraan" />
      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={findOrder} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="No. order, antrean, atau nomor polisi" className="pl-9 uppercase" />
            </div>
            <Button type="submit"><Search className="h-4 w-4" /> Cari Order</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Contoh: WF-261003-026, #26, atau B 1234 ABC. Kendaraan tanpa pelat dicari melalui nomor order atau antrean.</p>
        </CardContent>
      </Card>
      {unpaidOrders.length === 0 ? (
        <EmptyState icon={ReceiptIcon} title="Tidak ada tagihan aktif" desc="Semua order sudah dibayar." />
      ) : filteredUnpaidOrders.length === 0 ? (
        <EmptyState icon={Search} title="Order tidak ditemukan" desc="Periksa kembali nomor polisi, antrean, atau nomor order yang dimasukkan." action={<Button variant="outline" onClick={() => setSearch('')}>Tampilkan Semua</Button>} />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold">Order Belum Dibayar</span>
            <span className="text-muted-foreground">{filteredUnpaidOrders.length} order</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredUnpaidOrders.map((o) => {
            const v = getVehicle(o.vehicleId); const c = getCustomer(o.customerId);
            return (
              <Card key={o.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2"><span className="text-lg font-bold">{vehicleLabel(v)}</span><div className="flex flex-wrap justify-end gap-1.5"><StatusBadge status={o.workStatus} /><PaymentStatusBadge status={o.paymentStatus} /></div></div>
                  <div className="text-xs text-muted-foreground">{c?.name} · {getVehicleCategory(o.categoryId)?.name} · #{o.queueNo}</div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total</span><Money value={o.priceSnapshot?.total} className="text-lg font-bold text-primary" /></div>
                  <Button className="w-full" onClick={() => openPay(o)}><CreditCard className="mr-1.5 h-4 w-4" /> Proses Pembayaran</Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={!!payId} onOpenChange={(v) => !v && setPayId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Pembayaran — {payOrder?.orderNo}</DialogTitle></DialogHeader>
          {payOrder && <OrderDetailBody order={payOrder} />}
          <div className="rounded-lg border bg-muted/40 p-4">
            <Label className="mb-2 block text-sm font-semibold">Metode Pembayaran</Label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${method === m.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{m.name}</button>
              ))}
            </div>
            <Label className="mb-2 block text-sm font-semibold">Diskon <span className="font-normal text-muted-foreground">(maks {rupiah(DISCOUNT_LIMIT_NOMINAL)} atau {DISCOUNT_LIMIT_PERCENT}%)</span></Label>
            <div className="flex gap-2">
              <div className="inline-flex overflow-hidden rounded-lg border">
                <button onClick={() => setDiscType('nominal')} className={`px-3 py-2 text-sm font-semibold ${discType === 'nominal' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>Rp</button>
                <button onClick={() => setDiscType('percent')} className={`px-3 py-2 text-sm font-semibold ${discType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>%</button>
              </div>
              <Input type="number" value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder="0" className="flex-1" />
            </div>
            {overLimit && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm font-medium text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /> Perlu persetujuan Admin.</div>
            )}
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={subtotal} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span className="text-emerald-600">- {rupiah(discNominal)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total Bayar</span><Money value={total} /></div>
            </div>
            <Button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700" disabled={overLimit} onClick={confirm}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Konfirmasi Pembayaran</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="no-print"><DialogTitle>Struk Pembayaran</DialogTitle></DialogHeader>
          {receipt && <Receipt order={receipt.order} payment={receipt.payment} />}
          <div className="no-print mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" /> Cetak Struk</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={shareWa}><Share2 className="mr-1.5 h-4 w-4" /> Bagikan WhatsApp</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
