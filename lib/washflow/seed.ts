import { VEHICLE_CATEGORIES, WORK_STATUS_FLOW, getChecklistFor } from './constants';
import { computePrice } from './pricing';

export const DEMO_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1633014041037-f5446fb4ce99?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxjYXIlMjB3YXNofGVufDB8fHx8MTc5MDk4NDkwMnww&ixlib=rb-4.1.0&q=85',
  dirty: [
    'https://images.unsplash.com/photo-1702235548944-87199c005acb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxkaXJ0eSUyMGNhcnxlbnwwfHx8fDE3OTA5ODQ5MDJ8MA&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1586733564032-3db923113ff0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxtdWRkeSUyMHZlaGljbGV8ZW58MHx8fHwxNzkwOTg0OTExfDA&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1554863804-69546eb96737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxtdWRkeSUyMHZlaGljbGV8ZW58MHx8fHwxNzkwOTg0OTExfDA&ixlib=rb-4.1.0&q=85',
  ],
};

const ADDON_PRICES = { wax: 25000, vacuum: 20000, pengharum: 10000, jok: 30000, poles_ban: 15000 };
const CATEGORY_MULTIPLIER = {
  motor: 1,
  mobil_kecil: 1,
  mobil_sedang: 1.2,
  mobil_besar: 1.4,
  pickup_van: 1.5,
  truk: 1,
  bus: 1,
};

const round500 = (value) => Math.round(value / 500) * 500;

function buildInspectionCatalog() {
  return Object.fromEntries(VEHICLE_CATEGORIES.map((category) => {
    const multiplier = CATEGORY_MULTIPLIER[category.id] || 1;
    const points = getChecklistFor(category.id).map((point) => ({
      id: point.id,
      label: point.label,
      prices: Object.fromEntries(Object.entries(point.prices).map(([level, price]) => [level, round500(Number(price) * multiplier)])),
    }));
    return [category.id, points];
  }));
}

const iso = (date) => date.toISOString();
function minsAgo(minutes) { return iso(new Date(Date.now() - minutes * 60000)); }
function dayAt(daysAgo, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return iso(date);
}

export function buildSeed() {
  const inspectionCatalog = buildInspectionCatalog();
  const pricingDb = { inspectionCatalog, addonPrices: { ...ADDON_PRICES } };

  const outlet = {
    name: 'WashFlow Carwash — Cabang Utama',
    address: 'Jl. Merdeka No. 12, Jakarta Pusat',
    phone: '0812-3456-7890',
    footer: 'Terima kasih telah mencuci di WashFlow!',
  };

  const users = [
    { id: 'u_admin', name: 'Budi Santoso', username: 'budi', email: 'admin@washflow.id', password: 'demo123', role: 'admin', initial: 'BS', active: true },
    { id: 'u_op', name: 'Andi Pratama', username: 'andi', email: 'operator@washflow.id', password: 'demo123', role: 'operator', initial: 'AP', active: true },
    { id: 'u_kasir', name: 'Sari Dewi', username: 'sari', email: 'kasir@washflow.id', password: 'demo123', role: 'kasir', initial: 'SD', active: true },
  ];

  const customers = [
    { id: 'c1', name: 'Budi Hartono', whatsapp: '081234567001' },
    { id: 'c2', name: 'Siti Aminah', whatsapp: '081234567002' },
    { id: 'c3', name: 'Agus Wijaya', whatsapp: '081234567003' },
    { id: 'c4', name: 'Dewi Lestari', whatsapp: '081234567004' },
    { id: 'c5', name: 'Rudi Salim', whatsapp: '081234567005' },
    { id: 'c6', name: 'Maya Putri', whatsapp: '081234567006' },
    { id: 'c7', name: 'PT Logistik Jaya', whatsapp: '081234567007' },
    { id: 'c8', name: 'Rina Melati', whatsapp: '081234567008' },
    { id: 'c9', name: 'Hendra Gunawan', whatsapp: '081234567009' },
  ];

  const vehicles = [
    { id: 'v1', plate: 'B 1234 ABC', categoryId: 'mobil_kecil', brand: 'Toyota Agya', color: 'Merah', customerId: 'c1' },
    { id: 'v2', plate: 'B 1235 ZZ', categoryId: 'motor', brand: 'Honda Beat', color: 'Hitam', customerId: 'c1' },
    { id: 'v3', plate: 'B 5678 XYZ', categoryId: 'mobil_sedang', brand: 'Honda Mobilio', color: 'Putih', customerId: 'c2' },
    { id: 'v4', plate: 'D 4321 KLM', categoryId: 'motor', brand: 'Honda Vario', color: 'Biru', customerId: 'c3' },
    { id: 'v5', plate: 'B 9988 QRS', categoryId: 'mobil_besar', brand: 'Toyota Fortuner', color: 'Hitam', customerId: 'c4' },
    { id: 'v6', plate: 'F 1122 GH', categoryId: 'pickup_van', brand: 'Suzuki Carry', color: 'Biru', customerId: 'c5' },
    { id: 'v7', plate: 'B 2468 MNO', categoryId: 'motor', brand: 'Yamaha NMAX', color: 'Abu-abu', customerId: 'c6' },
    { id: 'v8', plate: 'L 7777 BA', categoryId: 'truk', brand: 'Mitsubishi Fuso', color: 'Kuning', customerId: 'c7' },
    { id: 'v9', plate: 'B 3030 US', categoryId: 'bus', brand: 'Hino R260', color: 'Putih', customerId: 'c7' },
    { id: 'v10', plate: 'B 4455 TY', categoryId: 'mobil_kecil', brand: 'Daihatsu Ayla', color: 'Silver', customerId: 'c8' },
    { id: 'v11', plate: 'AB 8899 CD', categoryId: 'mobil_sedang', brand: 'Toyota Avanza', color: 'Abu-abu', customerId: 'c9' },
  ];

  const vehicleMap = Object.fromEntries(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const inspections = [];
  const orders = [];
  const payments = [];
  let orderCounter = 0;
  let queueCounter = 0;
  let invoiceCounter = 0;

  const ymd = (isoString) => {
    const date = new Date(isoString);
    return `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  };

  function makeSelections(categoryId, level, salt = 0) {
    const levels = ['ringan', 'sedang', 'berat'];
    const targetIndex = levels.indexOf(level);
    return Object.fromEntries(inspectionCatalog[categoryId].map((point, index) => {
      const pointLevel = index % 3 === salt % 3 ? level : levels[Math.max(0, targetIndex - 1)];
      return [point.id, pointLevel];
    }));
  }

  function makeOrder({ veh, level, addons, status, createdAt, discount = 0, insp = {}, salt = 0 }: any) {
    orderCounter += 1;
    queueCounter += 1;
    const selections = makeSelections(veh.categoryId, level, salt);
    const snapshot = computePrice(pricingDb, { categoryId: veh.categoryId, inspectionSelections: selections, addonIds: addons }, discount);
    const inspectionId = `insp_${inspections.length + 1}`;
    inspections.push({
      id: inspectionId,
      vehicleId: veh.id,
      categoryId: veh.categoryId,
      selections,
      items: snapshot.inspectionItems,
      visualNotes: insp.notes || '',
      photos: insp.photos || [],
      operatorId: 'u_op',
      createdAt,
    });

    const statusIndex = WORK_STATUS_FLOW.indexOf(status);
    const baseTime = new Date(createdAt).getTime();
    const workStatusHistory = WORK_STATUS_FLOW.slice(0, statusIndex + 1).map((item, index) => ({
      status: item,
      at: iso(new Date(baseTime + index * 12 * 60000)),
    }));
    const order = {
      id: `ord_${orderCounter}`,
      orderNo: `WF-${ymd(createdAt)}-${String(orderCounter).padStart(3, '0')}`,
      queueNo: queueCounter,
      vehicleId: veh.id,
      customerId: veh.customerId,
      categoryId: veh.categoryId,
      serviceName: 'Cuci Reguler',
      inspectionId,
      inspectionItems: snapshot.inspectionItems,
      addonIds: addons,
      approved: true,
      approvedAt: createdAt,
      operatorId: 'u_op',
      operatorNote: insp.operatorNote || '',
      resultNote: '',
      photosBefore: insp.photos || [],
      photosAfter: [],
      workStatus: status,
      paymentStatus: 'belum_dibayar',
      workStatusHistory,
      paymentStatusHistory: [{ status: 'belum_dibayar', at: createdAt }],
      createdAt,
      discount,
      priceSnapshot: snapshot,
      paymentId: null,
    };
    orders.push(order);
    return order;
  }

  function makePayment(order, { method, discount = 0, discountType = 'nominal' }, paidAt) {
    invoiceCounter += 1;
    const snapshot = { ...order.priceSnapshot, discount, total: Math.max(0, order.priceSnapshot.subtotal - discount) };
    const payment = {
      id: `pay_${invoiceCounter}`,
      orderId: order.id,
      invoiceNo: `INV-${ymd(paidAt)}-${String(invoiceCounter).padStart(3, '0')}`,
      method,
      discount,
      discountType,
      subtotal: snapshot.subtotal,
      total: snapshot.total,
      cashierId: 'u_kasir',
      createdAt: paidAt,
    };
    payments.push(payment);
    order.paymentId = payment.id;
    order.discount = discount;
    order.priceSnapshot = snapshot;
    order.paymentStatus = 'dibayar';
    order.paymentStatusHistory.push({ status: 'dibayar', at: paidAt });
    return payment;
  }

  makeOrder({ veh: vehicleMap.v3, level: 'sedang', addons: ['wax'], status: 'menunggu', createdAt: minsAgo(8), salt: 1 });
  makeOrder({ veh: vehicleMap.v4, level: 'ringan', addons: [], status: 'dicuci', createdAt: minsAgo(25), salt: 2 });
  makeOrder({
    veh: vehicleMap.v5,
    level: 'berat',
    addons: ['vacuum', 'jok', 'pengharum'],
    status: 'finishing',
    createdAt: minsAgo(55),
    salt: 0,
    insp: {
      notes: 'Lumpur tebal di kolong dan spakbor. Terdapat baret halus pintu kiri.',
      operatorNote: 'Kendaraan bekas jalan proyek, perlu perhatian ekstra pada kolong.',
      photos: DEMO_IMAGES.dirty,
    },
  });
  makeOrder({ veh: vehicleMap.v6, level: 'sedang', addons: ['vacuum'], status: 'selesai', createdAt: minsAgo(80), salt: 1 });
  makeOrder({ veh: vehicleMap.v7, level: 'ringan', addons: [], status: 'selesai', createdAt: minsAgo(95), salt: 2 });

  const todayPaid = makeOrder({ veh: vehicleMap.v1, level: 'sedang', addons: ['poles_ban'], status: 'selesai', createdAt: dayAt(0, 8, 15), salt: 0 });
  makePayment(todayPaid, { method: 'qris', discount: 0 }, dayAt(0, 8, 45));

  const levels = ['ringan', 'sedang', 'berat'];
  const methods = ['tunai', 'qris', 'transfer'];
  const addonSets = [[], ['wax'], ['vacuum'], ['pengharum', 'poles_ban'], ['jok']];
  let seedNumber = 7;
  for (let day = 1; day <= 7; day += 1) {
    const count = 2 + (day % 3);
    for (let index = 0; index < count; index += 1) {
      seedNumber = (seedNumber * 7 + 13) % 97;
      const vehicle = vehicles[seedNumber % vehicles.length];
      const level = levels[(seedNumber + day) % levels.length];
      const addons = addonSets[(seedNumber + index) % addonSets.length];
      const method = methods[(seedNumber + day + index) % methods.length];
      const discount = seedNumber % 4 === 0 ? 10000 : 0;
      const createdAt = dayAt(day, 9 + (index * 2) % 8, seedNumber % 50);
      const order = makeOrder({ veh: vehicle, level, addons, status: 'selesai', createdAt, salt: index });
      makePayment(order, { method, discount }, dayAt(day, 9 + (index * 2) % 8, (seedNumber % 50) + 20));
    }
  }

  return {
    version: 6,
    outlet,
    users,
    vehicleCategories: VEHICLE_CATEGORIES.map((category) => ({ ...category })),
    inspectionCatalog,
    addonPrices: { ...ADDON_PRICES },
    customers,
    vehicles,
    inspections,
    orders,
    payments,
    counters: { order: orderCounter, queue: queueCounter, invoice: invoiceCounter },
  };
}
