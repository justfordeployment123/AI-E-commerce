// Category labels that live under the /shop/others page rather than having
// their own top-level /shop/<category> route. Shared so every place that
// needs to tell "real" shop categories (phones, laptops, ...) apart from
// "other" accessory/misc categories (films, games, storage, ...) agrees on
// the same list — duplicating this inline drifts silently otherwise.
export const OTHER_CATEGORIES = [
  'other', 'others', 'accessories', 'cables', 'chargers', 'memory', 'storage',
  'mouse', 'pen', 'graphics', 'lens', 'smartwatches', 'games', 'films',
  'camera lenses', 'graphics cards', 'mouse & peripherals', 'stylus & pens',
];

export function isOtherCategory(category?: string): boolean {
  return OTHER_CATEGORIES.includes((category || '').toLowerCase());
}

export function isOtherProduct(category?: string, imgUrl?: string): boolean {
  const url = (imgUrl || '').toLowerCase();
  return isOtherCategory(category) || url.includes('/other/') || url.includes('/others/');
}
