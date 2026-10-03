import { ADDONS } from './constants';

// Build an immutable price snapshot from the selected inspection levels and
// add-ons. There is intentionally no base charge.
export function computePrice(db, { categoryId, inspectionSelections = {}, addonIds = [] }, discount = 0) {
  const catalog = db?.inspectionCatalog?.[categoryId] || [];
  const inspectionItems = catalog
    .filter((item) => inspectionSelections[item.id])
    .map((item) => {
      const severity = inspectionSelections[item.id];
      return {
        itemId: item.id,
        label: item.label,
        severity,
        price: Number(item.prices?.[severity]) || 0,
      };
    });
  const inspectionTotal = inspectionItems.reduce((sum, item) => sum + item.price, 0);
  const addonItems = addonIds.map((id) => ({
    id,
    name: ADDONS.find((a) => a.id === id)?.name || id,
    price: db?.addonPrices?.[id] || 0,
  }));
  const addonTotal = addonItems.reduce((s, a) => s + a.price, 0);
  const subtotal = inspectionTotal + addonTotal;
  const total = Math.max(0, subtotal - (discount || 0));
  return { inspectionItems, inspectionTotal, addonItems, addonTotal, subtotal, discount: discount || 0, total };
}
