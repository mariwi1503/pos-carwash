// Formatting helpers (Rupiah & dates in Indonesian)

export function rupiah(n) {
  const v = Number(n || 0);
  return 'Rp' + v.toLocaleString('id-ID');
}

export function rupiahShort(n) {
  const v = Number(n || 0);
  if (v >= 1000000) return 'Rp' + (v / 1000000).toFixed(1).replace('.0', '') + 'jt';
  if (v >= 1000) return 'Rp' + Math.round(v / 1000) + 'rb';
  return 'Rp' + v;
}

export function vehicleLabel(vehicle) {
  if (!vehicle) return '-';
  return vehicle.plate || 'Tanpa nomor polisi';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateFull(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(iso) {
  if (!iso) return '-';
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isToday(iso) {
  if (!iso) return false;
  return dayKey(iso) === dayKey(new Date().toISOString());
}

// Human readable waiting time from an ISO timestamp until now
export function waitingSince(iso) {
  if (!iso) return '-';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} mnt`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} jam ${m} mnt`;
}
