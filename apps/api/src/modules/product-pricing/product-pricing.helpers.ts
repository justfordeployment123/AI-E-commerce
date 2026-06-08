/** Rounds x to the nearest £5, with a minimum of £10. */
export function round5(x: number): number {
    return Math.max(Math.round(x / 5) * 5, 10);
}

/**
 * Computes the candidate resale price.
 * formula: market × multiplier × (1 + margin/100) × (1 - discount/100)
 *   sellMarginPct : additive markup (+) or markdown (-), range -50..50
 *   sellDiscountPct: promotional discount always reduces price, range 0..50
 */
export function computeCandidatePrice(
    marketPrice: number,
    conditionMultiplier: number,
    sellMarginPct  = 0,
    sellDiscountPct = 0,
): number {
    return round5(
        marketPrice * conditionMultiplier
        * (1 + sellMarginPct  / 100)
        * (1 - sellDiscountPct / 100),
    );
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
 * Maps a product condition enum value to its PricingConfig multiplier key.
 * Condition enum values: NEW, A, B, C, F
 */
export function conditionToMultiplierKey(condition: string): string {
    switch (condition) {
        case 'NEW': return 'multiplier_new';
        case 'A':   return 'multiplier_a';
        case 'B':   return 'multiplier_b';
        case 'C':   return 'multiplier_c';
        case 'F':   return 'multiplier_f';
        default:    return 'multiplier_b';
    }
}
