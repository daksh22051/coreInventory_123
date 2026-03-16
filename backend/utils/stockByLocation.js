function toKey(value) {
  return String(value || '');
}

function cloneLocations(locations) {
  if (!Array.isArray(locations)) return [];
  return locations.map((loc) => ({
    warehouse: loc.warehouse,
    rack: loc.rack || 'GENERAL',
    quantity: Number(loc.quantity || 0),
  }));
}

function findIndex(locations, warehouseId, rack = 'GENERAL') {
  const wh = toKey(warehouseId);
  const rk = rack || 'GENERAL';
  return locations.findIndex(
    (loc) => toKey(loc.warehouse) === wh && String(loc.rack || 'GENERAL') === rk
  );
}

function applyDeltaByLocation(product, { warehouseId, quantityDelta, rack = 'GENERAL' }) {
  const locations = cloneLocations(product.stockByLocation);
  const idx = findIndex(locations, warehouseId, rack);
  const delta = Number(quantityDelta || 0);

  if (idx < 0) {
    if (delta < 0) {
      return { success: false, message: 'Insufficient stock at source location' };
    }

    locations.push({ warehouse: warehouseId, rack, quantity: delta });
  } else {
    const nextQty = Number(locations[idx].quantity || 0) + delta;
    if (nextQty < 0) {
      return { success: false, message: 'Insufficient stock at source location' };
    }
    locations[idx].quantity = nextQty;
  }

  const cleaned = locations.filter((loc) => Number(loc.quantity || 0) > 0);
  const total = cleaned.reduce((sum, loc) => sum + Number(loc.quantity || 0), 0);

  product.stockByLocation = cleaned;
  product.stockQuantity = total;

  return { success: true };
}

function setLocationQuantity(product, { warehouseId, quantity, rack = 'GENERAL' }) {
  const locations = cloneLocations(product.stockByLocation);
  const idx = findIndex(locations, warehouseId, rack);
  const qty = Math.max(0, Number(quantity || 0));

  if (idx < 0) {
    if (qty > 0) locations.push({ warehouse: warehouseId, rack, quantity: qty });
  } else {
    locations[idx].quantity = qty;
  }

  const cleaned = locations.filter((loc) => Number(loc.quantity || 0) > 0);
  const total = cleaned.reduce((sum, loc) => sum + Number(loc.quantity || 0), 0);

  product.stockByLocation = cleaned;
  product.stockQuantity = total;

  return { success: true };
}

function ensureInitialLocationStock(product) {
  const locations = cloneLocations(product.stockByLocation);
  if (locations.length > 0) {
    product.stockQuantity = locations.reduce((sum, loc) => sum + Number(loc.quantity || 0), 0);
    product.stockByLocation = locations.filter((loc) => Number(loc.quantity || 0) > 0);
    return;
  }

  if (product.warehouse && Number(product.stockQuantity || 0) > 0) {
    product.stockByLocation = [
      {
        warehouse: product.warehouse,
        rack: 'GENERAL',
        quantity: Number(product.stockQuantity || 0),
      },
    ];
  }
}

module.exports = {
  applyDeltaByLocation,
  setLocationQuantity,
  ensureInitialLocationStock,
};
