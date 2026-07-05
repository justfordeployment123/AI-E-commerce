export const VALID_PROMO_CODES: Record<string, number> = {
    TECHSTOP10: 0.10,
};

export function computeDiscount(subtotal: number, promoCode?: string): number {
    const rate = promoCode ? (VALID_PROMO_CODES[promoCode.toUpperCase()] ?? 0) : 0;
    return Math.round(subtotal * rate * 100) / 100;
}
