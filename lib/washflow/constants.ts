// WashFlow master business data & domain constants

export const DB_KEY = 'washflow_db_v2';
export const SESSION_KEY = 'washflow_session_v1';

export const ROLES = {
  admin: { id: 'admin', label: 'Admin / Owner', desc: 'Dashboard, laporan, master data & pengaturan' },
  operator: { id: 'operator', label: 'Operator', desc: 'Terima kendaraan, inspeksi & antrean cuci' },
  kasir: { id: 'kasir', label: 'Kasir', desc: 'Pembayaran, diskon, struk & riwayat' },
};

export const VEHICLE_CATEGORIES = [
  { id: 'motor', name: 'Motor', type: 'motor' },
  { id: 'mobil_kecil', name: 'Mobil Kecil', type: 'mobil' },
  { id: 'mobil_sedang', name: 'Mobil Sedang / MPV', type: 'mobil' },
  { id: 'mobil_besar', name: 'Mobil Besar / SUV', type: 'mobil' },
  { id: 'pickup_van', name: 'Pickup / Van', type: 'mobil' },
  { id: 'truk', name: 'Truk', type: 'truk' },
  { id: 'bus', name: 'Bus', type: 'bus' },
];

export const DIRTINESS = [
  { id: 'ringan', name: 'Ringan', color: 'emerald' },
  { id: 'sedang', name: 'Sedang', color: 'amber' },
  { id: 'berat', name: 'Berat', color: 'red' },
];

export const ADDONS = [
  { id: 'wax', name: 'Wax / Coating' },
  { id: 'vacuum', name: 'Vacuum Mendalam' },
  { id: 'pengharum', name: 'Pengharum' },
  { id: 'jok', name: 'Pembersihan Jok' },
  { id: 'poles_ban', name: 'Poles Ban' },
];

// Vehicle work and payment move independently. An order is closed only after
// the work is finished and payment has been received.
export const WORK_STATUS_FLOW = ['menunggu', 'dicuci', 'finishing', 'selesai'];

export const WORK_STATUS_META = {
  menunggu: { label: 'Menunggu', color: 'slate', next: 'dicuci', nextLabel: 'Mulai Cuci' },
  dicuci: { label: 'Dicuci', color: 'cyan', next: 'finishing', nextLabel: 'Ke Finishing' },
  finishing: { label: 'Finishing', color: 'blue', next: 'selesai', nextLabel: 'Tandai Selesai' },
  selesai: { label: 'Selesai', color: 'emerald', next: null, nextLabel: null },
};

export const PAYMENT_STATUS_FLOW = ['belum_dibayar', 'dibayar'];

export const PAYMENT_STATUS_META = {
  belum_dibayar: { label: 'Belum Dibayar', color: 'orange' },
  dibayar: { label: 'Dibayar', color: 'green' },
};

export function isOrderClosed(order) {
  return order?.workStatus === 'selesai' && order?.paymentStatus === 'dibayar';
}

export const PAYMENT_METHODS = [
  { id: 'tunai', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
];

export const DISCOUNT_LIMIT_NOMINAL = 20000;
export const DISCOUNT_LIMIT_PERCENT = 10;

// Default inspection points. Prices are stored in the database per vehicle
// category so admins can change the checklist and rates independently.
export const CHECKLIST_TEMPLATES = {
  motor: [
    { id: 'bodi', label: 'Bodi motor', prices: { ringan: 2000, sedang: 4000, berat: 5000 } },
    { id: 'jok', label: 'Jok', prices: { ringan: 1000, sedang: 2000, berat: 3000 } },
    { id: 'velg', label: 'Velg & ban', prices: { ringan: 1500, sedang: 3000, berat: 5000 } },
    { id: 'mesin', label: 'Area mesin', prices: { ringan: 2000, sedang: 4000, berat: 7000 } },
    { id: 'rantai', label: 'Rantai / kolong', prices: { ringan: 1500, sedang: 3500, berat: 6000 } },
  ],
  mobil: [
    { id: 'bodi', label: 'Bodi', prices: { ringan: 2000, sedang: 4000, berat: 5000 } },
    { id: 'kaca', label: 'Kaca', prices: { ringan: 1000, sedang: 2000, berat: 3000 } },
    { id: 'ban', label: 'Ban & velg', prices: { ringan: 2000, sedang: 4000, berat: 6000 } },
    { id: 'kolong', label: 'Kolong', prices: { ringan: 3000, sedang: 6000, berat: 9000 } },
    { id: 'interior', label: 'Interior / kabin', prices: { ringan: 3000, sedang: 6000, berat: 10000 } },
    { id: 'jok', label: 'Jok', prices: { ringan: 2000, sedang: 5000, berat: 8000 } },
    { id: 'karpet', label: 'Karpet', prices: { ringan: 2000, sedang: 5000, berat: 8000 } },
    { id: 'bagasi', label: 'Bagasi', prices: { ringan: 1500, sedang: 3000, berat: 5000 } },
  ],
  truk: [
    { id: 'bodi', label: 'Bodi', prices: { ringan: 6000, sedang: 10000, berat: 16000 } },
    { id: 'kabin', label: 'Kabin', prices: { ringan: 5000, sedang: 9000, berat: 14000 } },
    { id: 'roda', label: 'Roda', prices: { ringan: 5000, sedang: 9000, berat: 15000 } },
    { id: 'kolong', label: 'Kolong', prices: { ringan: 7000, sedang: 13000, berat: 20000 } },
    { id: 'bak', label: 'Bak / box', prices: { ringan: 8000, sedang: 15000, berat: 24000 } },
  ],
  bus: [
    { id: 'bodi', label: 'Bodi / eksterior', prices: { ringan: 10000, sedang: 18000, berat: 28000 } },
    { id: 'penumpang', label: 'Area penumpang', prices: { ringan: 8000, sedang: 15000, berat: 24000 } },
    { id: 'kursi', label: 'Kursi', prices: { ringan: 8000, sedang: 16000, berat: 25000 } },
    { id: 'lorong', label: 'Lorong', prices: { ringan: 5000, sedang: 10000, berat: 16000 } },
    { id: 'bagasi', label: 'Bagasi', prices: { ringan: 7000, sedang: 13000, berat: 20000 } },
  ],
};

export function getCategory(id) {
  return VEHICLE_CATEGORIES.find((c) => c.id === id);
}
export function getAddon(id) {
  return ADDONS.find((a) => a.id === id);
}
export function getChecklistFor(categoryId) {
  const cat = getCategory(categoryId);
  return CHECKLIST_TEMPLATES[cat?.type] || CHECKLIST_TEMPLATES.mobil;
}
