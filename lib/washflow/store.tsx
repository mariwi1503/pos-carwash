'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { CHECKLIST_TEMPLATES, DB_KEY, SESSION_KEY, VEHICLE_CATEGORIES, WORK_STATUS_FLOW } from './constants';
import { buildSeed } from './seed';
import { computePrice } from './pricing';

const WashflowContext = createContext(null);

const LEGACY_USER_CREDENTIALS = {
  u_admin: { username: 'budi', email: 'admin@washflow.id', password: 'demo123' },
  u_op: { username: 'andi', email: 'operator@washflow.id', password: 'demo123' },
  u_kasir: { username: 'sari', email: 'kasir@washflow.id', password: 'demo123' },
};

function userInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

function migrateDb(data) {
  if (!data?.users) return data;
  let changed = data.version !== 6;
  const vehicleCategories = Array.isArray(data.vehicleCategories)
    ? data.vehicleCategories
    : VEHICLE_CATEGORIES.map((category) => ({ ...category }));
  if (!Array.isArray(data.vehicleCategories)) changed = true;
  const users = data.users.map((user, index) => {
    const legacy = LEGACY_USER_CREDENTIALS[user.id] || {};
    const fallbackUsername = user.name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.') || `user${index + 1}`;
    const migrated = {
      ...user,
      username: user.username || legacy.username || fallbackUsername,
      email: user.email || legacy.email || `${fallbackUsername}@washflow.local`,
      password: user.password || legacy.password || 'demo123',
      initial: user.initial || userInitials(user.name),
      active: user.active !== false,
    };
    if (!user.username || !user.email || !user.password || !user.initial || user.active == null) changed = true;
    return migrated;
  });
  const vehicles = (data.vehicles || []).map((vehicle) => {
    if (vehicle.plate) return vehicle;
    const { vehicleCode, withoutPlate, ...withoutInternalCode } = vehicle;
    if (vehicleCode || withoutPlate != null || vehicle.plate === '') changed = true;
    return { ...withoutInternalCode, plate: null };
  });
  const orders = (data.orders || []).map((order) => {
    if (order.workStatus && order.paymentStatus) return order;
    changed = true;
    const oldStatus = order.status || 'menunggu';
    const workStatus = ['menunggu_pembayaran', 'dibayar'].includes(oldStatus) ? 'selesai' : oldStatus;
    const paymentStatus = oldStatus === 'dibayar' || order.paymentId ? 'dibayar' : 'belum_dibayar';
    const oldHistory = order.statusHistory || [];
    const workStatusHistory = oldHistory.filter((item) => WORK_STATUS_FLOW.includes(item.status));
    if (workStatus === 'selesai' && !workStatusHistory.some((item) => item.status === 'selesai')) {
      const completionEntry = oldHistory.find((item) => ['menunggu_pembayaran', 'dibayar'].includes(item.status));
      workStatusHistory.push({ status: 'selesai', at: completionEntry?.at || order.createdAt });
    }
    const payment = (data.payments || []).find((item) => item.orderId === order.id);
    const paymentStatusHistory = [{ status: 'belum_dibayar', at: order.createdAt }];
    if (paymentStatus === 'dibayar') paymentStatusHistory.push({ status: 'dibayar', at: payment?.createdAt || order.createdAt });
    const { status, statusHistory, ...rest } = order;
    return { ...rest, workStatus, paymentStatus, workStatusHistory, paymentStatusHistory };
  });
  return changed ? { ...data, version: 6, users, vehicleCategories, vehicles, orders } : data;
}

function loadDb() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveDb(db) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
}

export function WashflowProvider({ children }) {
  const [db, setDb] = useState(null);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  // Load / seed on mount (client only -> SSR safe)
  useEffect(() => {
    let data = loadDb();
    if (!data) {
      data = buildSeed();
    }
    data = migrateDb(data);
    saveDb(data);
    setDb(data);
    try {
      const s = window.localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s));
    } catch (e) {}
    setReady(true);
  }, []);

  const persist = useCallback((updater) => {
    setDb((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveDb(next);
      return next;
    });
  }, []);

  const now = () => new Date().toISOString();

  // ---- Auth ----
  const login = useCallback((identifier, password) => {
    const normalized = identifier.trim().toLowerCase();
    const user = db?.users?.find((item) => (
      (item.username?.toLowerCase() === normalized || item.email?.toLowerCase() === normalized)
      && item.password === password
    ));
    if (!user) return { ok: false, error: 'Email/username atau password tidak sesuai.' };
    if (user.active === false) return { ok: false, error: 'Akun ini sedang dinonaktifkan.' };
    const nextSession = { userId: user.id, role: user.role, name: user.name };
    try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); } catch (e) {}
    setSession(nextSession);
    return { ok: true, user };
  }, [db]);

  const logout = useCallback(() => {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
    setSession(null);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildSeed();
    saveDb(fresh);
    setDb(fresh);
  }, []);

  // ---- Lookups ----
  const findVehicleByPlate = useCallback((plate) => {
    if (!db || !plate) return null;
    const norm = plate.trim().toUpperCase().replace(/\s+/g, ' ');
    return db.vehicles.find((v) => v.plate?.toUpperCase().replace(/\s+/g, ' ') === norm) || null;
  }, [db]);

  const vehicleHistory = useCallback((vehicleId) => {
    if (!db) return [];
    return db.orders.filter((o) => o.vehicleId === vehicleId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db]);

  const getCustomer = useCallback((id) => db?.customers.find((c) => c.id === id), [db]);
  const getVehicle = useCallback((id) => db?.vehicles.find((v) => v.id === id), [db]);
  const getVehicleCategory = useCallback((id) => db?.vehicleCategories?.find((category) => category.id === id), [db]);
  const getInspection = useCallback((id) => db?.inspections.find((i) => i.id === id), [db]);
  const getPayment = useCallback((id) => db?.payments.find((p) => p.id === id), [db]);

  // ---- Create order (receive vehicle) ----
  const createOrder = useCallback((payload) => {
    let created;
    persist((prev) => {
      const next = { ...prev };
      next.customers = [...prev.customers];
      next.vehicles = [...prev.vehicles];
      next.inspections = [...prev.inspections];
      next.orders = [...prev.orders];

      const createdAt = now();
      const d = new Date(createdAt);
      const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const counters = { ...prev.counters };
      const plateNorm = (payload.plate || '').trim().toUpperCase().replace(/\s+/g, ' ');
      let vehicle = payload.withoutPlate
        ? null
        : next.vehicles.find((item) => item.plate?.toUpperCase().replace(/\s+/g, ' ') === plateNorm);
      let customer;
      if (vehicle) {
        customer = next.customers.find((c) => c.id === vehicle.customerId);
        if (customer && (payload.customerName || payload.whatsapp)) {
          customer = { ...customer, name: payload.customerName || customer.name, whatsapp: payload.whatsapp || customer.whatsapp };
          next.customers = next.customers.map((c) => (c.id === customer.id ? customer : c));
        }
        vehicle = { ...vehicle, categoryId: payload.categoryId || vehicle.categoryId, brand: payload.brand || vehicle.brand, color: payload.color || vehicle.color };
        next.vehicles = next.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v));
      } else {
        customer = { id: 'c_' + uuid().slice(0, 8), name: payload.customerName || 'Pelanggan', whatsapp: payload.whatsapp || '' };
        next.customers.push(customer);
        vehicle = {
          id: 'v_' + uuid().slice(0, 8), plate: payload.withoutPlate ? null : plateNorm,
          categoryId: payload.categoryId,
          brand: payload.brand || '', color: payload.color || '', customerId: customer.id,
        };
        next.vehicles.push(vehicle);
      }

      const insp = payload.inspection || {};
      const snap = computePrice(prev, {
        categoryId: vehicle.categoryId,
        inspectionSelections: insp.selections || {},
        addonIds: payload.addonIds || [],
      }, 0);
      const inspection = {
        id: 'insp_' + uuid().slice(0, 8), vehicleId: vehicle.id, categoryId: vehicle.categoryId,
        selections: insp.selections || {}, items: snap.inspectionItems,
        visualNotes: insp.visualNotes || '', photos: insp.photos || [],
        operatorId: session?.userId || 'u_op',
        createdAt: now(),
      };
      next.inspections.push(inspection);

      counters.order += 1; counters.queue += 1;
      const order = {
        id: 'ord_' + uuid().slice(0, 8), orderNo: `WF-${ymd}-${String(counters.order).padStart(3, '0')}`,
        queueNo: counters.queue, vehicleId: vehicle.id, customerId: customer.id, categoryId: vehicle.categoryId,
        serviceName: 'Cuci Reguler', inspectionId: inspection.id, inspectionItems: snap.inspectionItems,
        addonIds: payload.addonIds || [], approved: true, approvedAt: createdAt,
        operatorId: session?.userId || 'u_op', operatorNote: payload.operatorNote || '', resultNote: '',
        photosBefore: insp.photos || [], photosAfter: [],
        workStatus: 'menunggu', paymentStatus: 'belum_dibayar',
        workStatusHistory: [{ status: 'menunggu', at: createdAt }],
        paymentStatusHistory: [{ status: 'belum_dibayar', at: createdAt }],
        createdAt, discount: 0, priceSnapshot: snap, paymentId: null,
      };
      next.orders.push(order);
      next.counters = counters;
      created = order;
      return next;
    });
    return created;
  }, [persist, session]);

  const updateWorkStatus = useCallback((orderId, status) => {
    persist((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId
        ? { ...o, workStatus: status, workStatusHistory: [...o.workStatusHistory, { status, at: now() }] }
        : o)),
    }));
  }, [persist]);

  const advanceOrder = useCallback((orderId) => {
    persist((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        const idx = WORK_STATUS_FLOW.indexOf(o.workStatus);
        const nextStatus = WORK_STATUS_FLOW[Math.min(idx + 1, WORK_STATUS_FLOW.length - 1)];
        if (nextStatus === o.workStatus) return o;
        return { ...o, workStatus: nextStatus, workStatusHistory: [...o.workStatusHistory, { status: nextStatus, at: now() }] };
      }),
    }));
  }, [persist]);

  const addOrderResult = useCallback((orderId, { resultNote, photosAfter }) => {
    persist((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId
        ? { ...o, resultNote: resultNote ?? o.resultNote, photosAfter: photosAfter ?? o.photosAfter }
        : o)),
    }));
  }, [persist]);

  const createPayment = useCallback((orderId, { method, discount = 0, discountType = 'nominal' }) => {
    let pay;
    persist((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order || order.paymentStatus === 'dibayar') return prev;
      const counters = { ...prev.counters, invoice: prev.counters.invoice + 1 };
      const snap = {
        ...order.priceSnapshot,
        discount,
        total: Math.max(0, order.priceSnapshot.subtotal - discount),
      };
      const d = new Date();
      const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      pay = {
        id: 'pay_' + uuid().slice(0, 8), orderId, invoiceNo: `INV-${ymd}-${String(counters.invoice).padStart(3, '0')}`,
        method, discount, discountType, subtotal: snap.subtotal, total: snap.total, cashierId: session?.userId || 'u_kasir', createdAt: now(),
      };
      const at = now();
      return {
        ...prev,
        counters,
        payments: [...prev.payments, pay],
        orders: prev.orders.map((o) => (o.id === orderId
          ? { ...o, paymentStatus: 'dibayar', discount, priceSnapshot: snap, paymentId: pay.id, paymentStatusHistory: [...o.paymentStatusHistory, { status: 'dibayar', at }] }
          : o)),
      };
    });
    return pay;
  }, [persist, session]);

  // ---- User management ----
  const createUser = useCallback((payload) => {
    const user = {
      id: 'u_' + uuid().slice(0, 8),
      name: payload.name.trim(),
      username: payload.username.trim().toLowerCase(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role,
      initial: userInitials(payload.name),
      active: payload.active !== false,
    };
    persist((prev) => ({ ...prev, users: [...prev.users, user] }));
    return user;
  }, [persist]);

  const updateUser = useCallback((userId, patch) => {
    const safePatch = { ...patch };
    if (session?.userId === userId) {
      delete safePatch.role;
      delete safePatch.active;
    }
    if (safePatch.name) safePatch.initial = userInitials(safePatch.name);
    if (safePatch.username) safePatch.username = safePatch.username.trim().toLowerCase();
    if (safePatch.email) safePatch.email = safePatch.email.trim().toLowerCase();
    persist((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === userId ? { ...user, ...safePatch } : user)),
    }));
    if (session?.userId === userId && safePatch.name) {
      setSession((current) => {
        const nextSession = { ...current, name: safePatch.name };
        try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); } catch (e) {}
        return nextSession;
      });
    }
  }, [persist, session]);

  const deleteUser = useCallback((userId) => {
    if (session?.userId === userId) return;
    persist((prev) => {
      const target = prev.users.find((user) => user.id === userId);
      const activeAdmins = prev.users.filter((user) => user.role === 'admin' && user.active !== false);
      if (target?.role === 'admin' && target.active !== false && activeAdmins.length <= 1) return prev;
      return { ...prev, users: prev.users.filter((user) => user.id !== userId) };
    });
  }, [persist, session]);

  // ---- Vehicle category management ----
  const createVehicleCategory = useCallback((payload) => {
    const category = {
      id: 'cat_' + uuid().slice(0, 8),
      name: payload.name.trim(),
      type: payload.type,
    };
    const template = CHECKLIST_TEMPLATES[payload.type] || CHECKLIST_TEMPLATES.mobil;
    persist((prev) => ({
      ...prev,
      vehicleCategories: [...prev.vehicleCategories, category],
      inspectionCatalog: {
        ...prev.inspectionCatalog,
        [category.id]: template.map((item) => ({
          ...item,
          prices: { ...item.prices },
        })),
      },
    }));
    return category;
  }, [persist]);

  const updateVehicleCategory = useCallback((categoryId, patch) => {
    persist((prev) => ({
      ...prev,
      vehicleCategories: prev.vehicleCategories.map((category) => (
        category.id === categoryId ? { ...category, ...patch, name: patch.name?.trim() || category.name } : category
      )),
    }));
  }, [persist]);

  const deleteVehicleCategory = useCallback((categoryId) => {
    persist((prev) => {
      const inUse = prev.vehicles.some((vehicle) => vehicle.categoryId === categoryId)
        || prev.orders.some((order) => order.categoryId === categoryId);
      if (inUse) return prev;
      const inspectionCatalog = { ...prev.inspectionCatalog };
      delete inspectionCatalog[categoryId];
      return {
        ...prev,
        vehicleCategories: prev.vehicleCategories.filter((category) => category.id !== categoryId),
        inspectionCatalog,
      };
    });
  }, [persist]);

  // ---- Master data editing ----
  const updateOutlet = useCallback((patch) => persist((prev) => ({ ...prev, outlet: { ...prev.outlet, ...patch } })), [persist]);
  const updateInspectionPoint = useCallback((categoryId, itemId, patch) => persist((prev) => ({
    ...prev,
    inspectionCatalog: {
      ...prev.inspectionCatalog,
      [categoryId]: prev.inspectionCatalog[categoryId].map((item) => (
        item.id === itemId
          ? { ...item, ...patch, prices: patch.prices ? { ...item.prices, ...patch.prices } : item.prices }
          : item
      )),
    },
  })), [persist]);
  const addInspectionPoint = useCallback((categoryId) => persist((prev) => {
    const item = {
      id: 'point_' + uuid().slice(0, 8),
      label: 'Poin inspeksi baru',
      prices: { ringan: 0, sedang: 0, berat: 0 },
    };
    return {
      ...prev,
      inspectionCatalog: {
        ...prev.inspectionCatalog,
        [categoryId]: [...prev.inspectionCatalog[categoryId], item],
      },
    };
  }), [persist]);
  const removeInspectionPoint = useCallback((categoryId, itemId) => persist((prev) => ({
    ...prev,
    inspectionCatalog: {
      ...prev.inspectionCatalog,
      [categoryId]: prev.inspectionCatalog[categoryId].filter((item) => item.id !== itemId),
    },
  })), [persist]);
  const updateAddonPrice = useCallback((addonId, value) => persist((prev) => ({ ...prev, addonPrices: { ...prev.addonPrices, [addonId]: Number(value) || 0 } })), [persist]);

  const value = {
    db, session, ready,
    login, logout, resetDemo,
    findVehicleByPlate, vehicleHistory, getCustomer, getVehicle, getVehicleCategory, getInspection, getPayment,
    createOrder, updateWorkStatus, advanceOrder, addOrderResult, createPayment,
    createUser, updateUser, deleteUser,
    createVehicleCategory, updateVehicleCategory, deleteVehicleCategory,
    updateOutlet, updateInspectionPoint, addInspectionPoint, removeInspectionPoint, updateAddonPrice,
  };

  return <WashflowContext.Provider value={value}>{children}</WashflowContext.Provider>;
}

export function useWashflow() {
  const ctx = useContext(WashflowContext);
  if (!ctx) throw new Error('useWashflow must be used within WashflowProvider');
  return ctx;
}
