import {
    round5,
    computeCandidatePrice,
    computeTradeInOffer,
    evaluateActive,
    conditionToMultiplierKey,
} from './product-pricing.helpers';

describe('round5', () => {
    it('rounds 347 down to 345', () => expect(round5(347)).toBe(345));
    it('rounds 343 up to 345', () => expect(round5(343)).toBe(345));
    it('enforces minimum of 10', () => expect(round5(3)).toBe(10));
    it('leaves exact multiples unchanged', () => expect(round5(350)).toBe(350));
    it('rounds 172.5 to 175', () => expect(round5(172.5)).toBe(175));
});

describe('computeCandidatePrice', () => {
    it('applies condition multiplier and margin: 600 * 0.82 * 0.70 = 344.4 → 345', () => {
        expect(computeCandidatePrice(600, 0.82, 30)).toBe(345);
    });
    it('mint at 30% margin: 600 * 1.0 * 0.70 = 420', () => {
        expect(computeCandidatePrice(600, 1.0, 30)).toBe(420);
    });
    it('damaged at 30% margin: 600 * 0.3 * 0.70 = 126 → 125', () => {
        expect(computeCandidatePrice(600, 0.3, 30)).toBe(125);
    });
});

describe('computeTradeInOffer', () => {
    it('345 * 0.50 = 172.5 → 175', () => expect(computeTradeInOffer(345, 0.5)).toBe(175));
    it('420 * 0.50 = 210', () => expect(computeTradeInOffer(420, 0.5)).toBe(210));
    it('enforces minimum of 10', () => expect(computeTradeInOffer(10, 0.1)).toBe(10));
});

describe('evaluateActive', () => {
    it('true when price > 0, image present, not flagged', () =>
        expect(evaluateActive(100, ['img.jpg'], 'auto_priced')).toBe(true));
    it('false when price is 0', () =>
        expect(evaluateActive(0, ['img.jpg'], 'auto_priced')).toBe(false));
    it('false when images empty', () =>
        expect(evaluateActive(100, [], 'auto_priced')).toBe(false));
    it('false when pricingStatus is flagged', () =>
        expect(evaluateActive(100, ['img.jpg'], 'flagged')).toBe(false));
    it('false when both price=0 and no images', () =>
        expect(evaluateActive(0, [], 'no_data')).toBe(false));
});

describe('conditionToMultiplierKey', () => {
    it('Pristine → multiplier_mint', () =>
        expect(conditionToMultiplierKey('Pristine')).toBe('multiplier_mint'));
    it('Excellent → multiplier_mint', () =>
        expect(conditionToMultiplierKey('Excellent')).toBe('multiplier_mint'));
    it('Very Good → multiplier_good', () =>
        expect(conditionToMultiplierKey('Very Good')).toBe('multiplier_good'));
    it('Good → multiplier_good', () =>
        expect(conditionToMultiplierKey('Good')).toBe('multiplier_good'));
    it('Fair → multiplier_used', () =>
        expect(conditionToMultiplierKey('Fair')).toBe('multiplier_used'));
    it('unknown → multiplier_used (safe fallback)', () =>
        expect(conditionToMultiplierKey('Unknown')).toBe('multiplier_used'));
});
