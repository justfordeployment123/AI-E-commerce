// Mirrors the frontend pricing logic so the server can validate/recompute offers.

export interface ServerPricingConfig {
    conditionMultipliers: Record<string, number>;
    marginPct: number;
    penaltyCrackedScreen: number;
    penaltyBattery: number;
    penaltyCharging: number;
}

export const DEFAULT_PRICING_CONFIG: ServerPricingConfig = {
    conditionMultipliers: { Mint: 1.0, Good: 0.82, Used: 0.62, Damaged: 0.3 },
    marginPct: 30,
    penaltyCrackedScreen: 25,
    penaltyBattery: 15,
    penaltyCharging: 12,
};

const BASE_PRICES: Record<string, number> = {
    "iPhone 15 Pro Max": 780, "iPhone 15 Pro": 680, "iPhone 15 Plus": 580,
    "iPhone 15": 520, "iPhone 14 Pro Max": 620, "iPhone 14 Pro": 540,
    "iPhone 14 Plus": 430, "iPhone 14": 380, "iPhone 13 Pro Max": 480,
    "iPhone 13 Pro": 420, "iPhone 13": 340, "iPhone 12 Pro Max": 320,
    "iPhone 12 Pro": 280, "iPhone 12": 230, "iPhone 11 Pro Max": 220,
    "iPhone 11 Pro": 190, "iPhone 11": 160,
    "Galaxy S24 Ultra": 720, "Galaxy S24+": 580, "Galaxy S24": 480,
    "Galaxy S23 Ultra": 580, "Galaxy S23+": 440, "Galaxy S23": 360,
    "Galaxy S22 Ultra": 440, "Galaxy S22+": 320, "Galaxy S22": 260,
    "Galaxy S21 Ultra": 300, "Galaxy S21+": 220, "Galaxy S21": 175,
    "Pixel 8 Pro": 560, "Pixel 8": 420, "Pixel 7 Pro": 380,
    "Pixel 7": 280, "Pixel 6 Pro": 240, "Pixel 6": 180,
    "PS5 Disc Edition": 340, "PS5 Digital Edition": 280, "PS4 Pro": 170,
    "PS4 Slim": 120, "PS4": 95, "PS3 Slim": 55, "PS3": 40,
    "Xbox Series X": 320, "Xbox Series S": 190, "Xbox One X": 140,
    "Xbox One S": 90, "Xbox One": 70, "Xbox 360 S": 40, "Xbox 360": 30,
    "Nintendo Switch OLED": 210, "Nintendo Switch (V2)": 155, "Nintendo Switch Lite": 110,
    'MacBook Pro 16" M3 Max': 1800, 'MacBook Pro 16" M3 Pro': 1500,
    'MacBook Pro 14" M3 Max': 1600, 'MacBook Pro 14" M3 Pro': 1200,
    'MacBook Air 15" M3': 900, 'MacBook Air 13" M3': 780,
    'MacBook Pro 16" M2 Max': 1400, 'MacBook Pro 16" M2 Pro': 1150,
    'MacBook Pro 14" M2 Pro': 1050, 'MacBook Air 15" M2': 780,
    'MacBook Air 13" M2': 680, 'MacBook Air 13" M1': 500,
    "Apple Watch Ultra 2": 410, "Apple Watch Series 9": 220,
    "Apple Watch Series 8": 160, "Apple Watch SE (2nd Gen)": 105,
    "Galaxy Watch 6 Classic": 150, "Galaxy Watch 6": 110,
    "Galaxy Watch 5 Pro": 90, "Galaxy Watch 5": 65,
    "Fitbit Sense 2": 85, "Fitbit Versa 4": 60, "Fitbit Charge 6": 45,
    "AirPods Max": 260, "AirPods Pro 2": 115, "AirPods Pro": 75, "AirPods 3rd Gen": 60,
    "WH-1000XM5": 170, "WF-1000XM5": 100, "WH-1000XM4": 100,
    "QuietComfort Ultra": 175, "QuietComfort II Headphones": 110, "QuietComfort Earbuds II": 85,
};

export function computeOffer(
    model: string,
    condition: string,
    answers: Record<string, string>,
    cfg: ServerPricingConfig = DEFAULT_PRICING_CONFIG,
): number {
    const base = BASE_PRICES[model] ?? 200;
    const mult = cfg.conditionMultipliers[condition] ?? 0.5;
    let price = base * mult;

    const crackedMult  = 1 - cfg.penaltyCrackedScreen / 100;
    const batteryMult  = 1 - cfg.penaltyBattery / 100;
    const chargingMult = 1 - cfg.penaltyCharging / 100;

    if (answers.screen === 'Cracked but display works') price *= crackedMult;
    if (answers.screen === 'Shattered / unusable display' || answers.screen === 'Shattered') price *= 0.4;
    if (answers.battery === '70–79% (Fair)') price *= 0.92;
    if (answers.battery === 'Below 70% / Unknown') price *= batteryMult;
    if (answers.battery === 'Drains quickly (1–3 hours)') price *= 0.88;
    if (answers.battery === 'Very poor under 1 hour' || answers.battery === 'Very poor under 3 hours') price *= batteryMult;
    if (answers.charging === 'No / Loose' || answers.charging === 'No / loose connection') price *= chargingMult;
    if (answers.biometrics === 'No / Faulty') price *= 0.9;
    if (answers.power === 'No, won\'t power on' || answers.power === 'No' || answers.power === 'Won\'t power on') price *= 0.25;
    if (answers.power === 'Yes but has some issues' || answers.power === 'Powers on but has screen/sensor issues') price *= 0.7;
    if (answers.back === 'Cracked back glass') price *= 0.88;
    if (answers.body === 'Significant damage' || answers.body === 'Heavy wear or staining') price *= 0.7;
    if (answers.body === 'Dents or significant marks' || answers.body === 'Minor scratches or wear on case') price *= 0.8;
    if (answers.screen === 'Cracked' || answers.screen === 'Cracked screen') price *= crackedMult;
    if (answers.screen === 'Deep scratches or chips') price *= crackedMult;
    if (answers.input === 'Major issues') price *= 0.6;
    if (answers.sound === 'Muffled sound or static in one ear') price *= 0.5;
    if (answers.sound === 'No sound in one/both ears') price *= 0.15;

    return Math.max(Math.round(price / 5) * 5, 10);
}

export function applyMargin(marketPrice: number, marginPct: number): number {
    return Math.max(Math.round(marketPrice * (1 - marginPct / 100) / 5) * 5, 10);
}
