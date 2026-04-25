
import { Ingredient, Inventory } from '../types';

type Dimension = 'mass' | 'volume' | 'count' | 'unknown';

interface CanonicalUnit {
  dim: Dimension;
  toBase: number; // multiply amount by this to get base-unit amount (g or ml)
}

const UNIT_MAP: Record<string, CanonicalUnit> = {
  // Mass
  'kg':  { dim: 'mass',   toBase: 1000 },
  'g':   { dim: 'mass',   toBase: 1 },
  'mg':  { dim: 'mass',   toBase: 0.001 },
  // Volume
  'l':   { dim: 'volume', toBase: 1000 },
  'ml':  { dim: 'volume', toBase: 1 },
  'el':  { dim: 'volume', toBase: 15 },
  'tl':  { dim: 'volume', toBase: 5 },
  // Count/discrete
  'stück':   { dim: 'count', toBase: 1 },
  'stk':     { dim: 'count', toBase: 1 },
  'stk.':    { dim: 'count', toBase: 1 },
  'bund':    { dim: 'count', toBase: 1 },
  'packung': { dim: 'count', toBase: 1 },
  'pck':     { dim: 'count', toBase: 1 },
  'dose':    { dim: 'count', toBase: 1 },
  'glas':    { dim: 'count', toBase: 1 },
  'flasche': { dim: 'count', toBase: 1 },
  'becher':  { dim: 'count', toBase: 1 },
  'scheibe': { dim: 'count', toBase: 1 },
  'prise':   { dim: 'count', toBase: 1 },
  'msp':     { dim: 'count', toBase: 1 }, // Messerspitze
  'zweig':   { dim: 'count', toBase: 1 },
  'zehe':    { dim: 'count', toBase: 1 },
  'kopf':    { dim: 'count', toBase: 1 },
};

function getCanonical(unit: string): CanonicalUnit {
  return UNIT_MAP[unit.toLowerCase().trim()] ?? { dim: 'unknown', toBase: 1 };
}

export function parseGermanNumber(s: string): number {
  if (!s) return 0;
  // Replace German decimal comma with dot, remove thousand-separating dots
  const normalized = s.trim().replace(/\.(?=\d{3})/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/en$/, '').replace(/n$/, '');
}

export function deductIngredient(inventory: Inventory, ingredient: Ingredient): Inventory {
  const ingNorm = normalizeName(ingredient.name);
  const ingCanon = getCanonical(ingredient.unit);

  // Find the best matching inventory item
  const idx = (() => {
    // Prefer exact name match first
    let i = inventory.items.findIndex(
      item => normalizeName(item.name) === ingNorm
    );
    if (i !== -1) return i;
    // Fallback: inventory item name contains ingredient name or vice versa
    i = inventory.items.findIndex(
      item => normalizeName(item.name).includes(ingNorm) || ingNorm.includes(normalizeName(item.name))
    );
    return i;
  })();

  if (idx === -1) {
    console.warn(`[Inventory] Kein passendes Inventar-Objekt für Zutat "${ingredient.name}" gefunden.`);
    return inventory;
  }

  const item = inventory.items[idx];
  const itemCanon = getCanonical(item.unit);

  if (ingCanon.dim === 'unknown' || itemCanon.dim === 'unknown') {
    console.warn(`[Inventory] Unbekannte Einheit: Rezept="${ingredient.unit}" oder Inventar="${item.unit}" — übersprungen.`);
    return inventory;
  }

  if (ingCanon.dim !== itemCanon.dim) {
    console.warn(`[Inventory] Inkompatible Einheiten: Rezept="${ingredient.unit}" (${ingCanon.dim}) vs Inventar="${item.unit}" (${itemCanon.dim}) — übersprungen.`);
    return inventory;
  }

  // Convert both to base unit, subtract, convert back to inventory unit
  const inventoryBase = item.amount * itemCanon.toBase;
  const ingredientBase = ingredient.amount * ingCanon.toBase;
  const remainingBase = inventoryBase - ingredientBase;

  const newItems = [...inventory.items];
  if (remainingBase <= 1e-6) {
    // Item fully consumed
    newItems.splice(idx, 1);
  } else {
    const newAmount = remainingBase / itemCanon.toBase;
    // Round to 4 decimal places to avoid floating point noise
    newItems[idx] = { ...item, amount: Math.round(newAmount * 10000) / 10000 };
  }

  return { ...inventory, items: newItems };
}

export function deductInventoryForRecipe(inventory: Inventory, ingredients: Ingredient[]): Inventory {
  return ingredients.reduce((inv, ing) => deductIngredient(inv, ing), inventory);
}
