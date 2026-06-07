/** Rounds x to the nearest £5, with a minimum of £10. */
export function round5(x: number): number {
    return Math.max(Math.round(x / 5) * 5, 10);
}

/**
 * Computes the candidate resale price.
 * formula: marketPrice × conditionMultiplier × (1 - marginPct/100), rounded to £5
 */
export function computeCandidatePrice(
    marketPrice: number,
    conditionMultiplier: number,
    marginPct: number,
): number {
    return round5(marketPrice * conditionMultiplier * (1 - marginPct / 100));
}

/**
 * Computes the trade-in offer from a known resale price.
 * formula: resalePrice × tradeInRatio, rounded to £5
 */
export function computeTradeInOffer(resalePrice: number | null, tradeInRatio: number): number {
    if (resalePrice == null) return 0;
    return round5(resalePrice * tradeInRatio);
}

/**
 * Returns true only when ALL activation gates are met:
 *   - price > 0
 *   - at least one image
 *   - pricingStatus is not 'flagged'
 */
export function evaluateActive(price: number | null, images: string[], pricingStatus: string): boolean {
    return price != null && price > 0 && images.length >= 1 && pricingStatus !== 'flagged';
}

/**
 * Maps a product condition string to its PricingConfig multiplier key.
 * Product conditions: Pristine, Excellent, Very Good, Good, Fair
 */
export function conditionToMultiplierKey(condition: string): string {
    const c = condition.toLowerCase();
    if (c === 'pristine' || c === 'excellent') return 'multiplier_mint';
    if (c === 'very good' || c === 'good')     return 'multiplier_good';
    return 'multiplier_used'; // Fair, damaged, or unknown
}
