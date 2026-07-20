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
    it('applies condition multiplier and margin: 600 * 0.82 * 1.30 = 639.6 → 640', () => {
        expect(computeCandidatePrice(600, 0.82, 30)).toBe(640);
    });
    it('mint at 30% margin: 600 * 1.0 * 1.30 = 780', () => {
        expect(computeCandidatePrice(600, 1.0, 30)).toBe(780);
    });
    it('damaged at 30% margin: 600 * 0.3 * 1.30 = 234 → 235', () => {
        expect(computeCandidatePrice(600, 0.3, 30)).toBe(235);
    });
    it('negative margin (markdown): 600 * 0.82 * 0.70 = 344.4 → 345', () => {
        expect(computeCandidatePrice(600, 0.82, -30)).toBe(345);
    });
    it('applies discount on top of margin: 600 * 0.82 * 1.30 * 0.90 = 575.64 → 575', () => {
        expect(computeCandidatePrice(600, 0.82, 30, 10)).toBe(575);
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
    it('NEW → multiplier_new', () =>
        expect(conditionToMultiplierKey('NEW')).toBe('multiplier_new'));
    it('A → multiplier_a', () =>
        expect(conditionToMultiplierKey('A')).toBe('multiplier_a'));
    it('B → multiplier_b', () =>
        expect(conditionToMultiplierKey('B')).toBe('multiplier_b'));
    it('C → multiplier_c', () =>
        expect(conditionToMultiplierKey('C')).toBe('multiplier_c'));
    it('F → multiplier_f', () =>
        expect(conditionToMultiplierKey('F')).toBe('multiplier_f'));
    it('unknown → multiplier_b (safe fallback)', () =>
        expect(conditionToMultiplierKey('Unknown')).toBe('multiplier_b'));
});
