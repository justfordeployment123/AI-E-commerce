import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/services/email.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

const SHIPPO_BASE = 'https://api.goshippo.com';
const DEFAULT_SERVICE_LEVEL = 'royalmail_tracked48';

export interface ShipmentRequest {
    reference:      string;
    customerName:   string;
    customerEmail:  string;
    customerPhone?: string;
    type:           'repair' | 'trade-in';
}

export interface ShipmentResult {
    trackingNumber: string;
    labelPdf:       Buffer;
}

@Injectable()
export class ShippingService {
    private readonly logger = new Logger(ShippingService.name);

    constructor(
        private readonly email: EmailService,
        private readonly prisma: PrismaService,
        private readonly settingsService: SettingsService,
    ) {}

    private async getApiKey(): Promise<string | null> {
        return this.settingsService.get('SHIPPO_API_KEY');
    }

    private async getServiceLevel(): Promise<string> {
        return (await this.settingsService.get('SHIPPO_SERVICE_LEVEL')) ?? DEFAULT_SERVICE_LEVEL;
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const key = await this.getApiKey();
        return {
            'Authorization': `ShippoToken ${key ?? ''}`,
            'Content-Type':  'application/json',
        };
    }

    private async getStoreAddress() {
        const store = await this.prisma.store.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
        return {
            name:    store?.name     || 'TechStop Leicester',
            street1: store?.address  || '1 High Street',
            city:    store?.city     || 'Leicester',
            zip:     store?.postcode || 'LE1 1AA',
            country: 'GB',
            email:   store?.phone    || '',
        };
    }

    async generatePrepaidLabel(req: ShipmentRequest): Promise<ShipmentResult> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            this.logger.warn('SHIPPO_API_KEY not set — using mock label');
            return this.mockLabel(req.reference);
        }

        const storeAddress = await this.getStoreAddress();
        const headers = await this.getHeaders();

        // Step 1: Create shipment and get rates (async: false = wait for rates inline)
        const shipmentRes = await fetch(`${SHIPPO_BASE}/shipments/`, {
            method:  'POST',
            headers,
            body: JSON.stringify({
                address_from: {
                    name:    req.customerName,
                    street1: 'As provided at booking',
                    city:    'Leicester',
                    zip:     'LE1 1AA',
                    country: 'GB',
                    email:   req.customerEmail,
                    phone:   req.customerPhone ?? '',
                },
                address_to: storeAddress,
                parcels: [{
                    length:        '20',
                    width:         '15',
                    height:        '5',
                    distance_unit: 'cm',
                    weight:        '0.5',
                    mass_unit:     'kg',
                }],
                async: false,
            }),
        });

        if (!shipmentRes.ok) {
            const err = await shipmentRes.text();
            this.logger.error(`Shippo shipment creation failed: ${err}`);
            throw new Error(`Shippo API error: ${shipmentRes.status}`);
        }

        const shipment = await shipmentRes.json() as {
            object_id: string;
            rates: Array<{ object_id: string; servicelevel: { token: string } }>;
        };

        // Step 2: Pick the configured service level, fall back to first available rate
        const serviceLevel = await this.getServiceLevel();
        const rate = shipment.rates.find(r => r.servicelevel.token === serviceLevel)
                  ?? shipment.rates[0];

        if (!rate) {
            this.logger.error('No shipping rates returned by Shippo');
            throw new Error('No shipping rates available');
        }

        // Step 3: Purchase the label
        const txRes = await fetch(`${SHIPPO_BASE}/transactions/`, {
            method:  'POST',
            headers,
            body: JSON.stringify({
                rate:            rate.object_id,
                label_file_type: 'PDF',
                async:           false,
            }),
        });

        if (!txRes.ok) {
            const err = await txRes.text();
            this.logger.error(`Shippo transaction failed: ${err}`);
            throw new Error(`Shippo transaction error: ${txRes.status}`);
        }

        const tx = await txRes.json() as {
            status:          string;
            tracking_number: string;
            label_url:       string;
        };

        if (tx.status !== 'SUCCESS') {
            this.logger.error(`Shippo transaction not successful: ${JSON.stringify(tx)}`);
            throw new Error('Shippo label generation failed');
        }

        // Step 4: Download the PDF
        const pdfRes = await fetch(tx.label_url);
        if (!pdfRes.ok) throw new Error('Failed to download label PDF from Shippo');
        const labelPdf = Buffer.from(await pdfRes.arrayBuffer());

        return { trackingNumber: tx.tracking_number, labelPdf };
    }

    async sendLabelEmail(req: ShipmentRequest, result: ShipmentResult) {
        await this.email.sendShippingLabel({
            to:             req.customerEmail,
            customerName:   req.customerName,
            reference:      req.reference,
            trackingNumber: result.trackingNumber,
            type:           req.type,
            labelPdf:       result.labelPdf,
        });
    }

    async trackShipment(trackingNumber: string): Promise<{ status: string; events: any[] }> {
        const apiKey = await this.getApiKey();
        if (!apiKey) return { status: 'unknown', events: [] };

        const res = await fetch(`${SHIPPO_BASE}/tracks/shippo/${trackingNumber}`, {
            headers: await this.getHeaders(),
        });

        if (!res.ok) return { status: 'unknown', events: [] };

        const data = await res.json() as any;
        return {
            status: data?.tracking_status?.status ?? 'unknown',
            events: data?.tracking_history ?? [],
        };
    }

    private mockLabel(reference: string): ShipmentResult {
        const trackingNumber = `MOCK${reference.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}GB`;
        const labelPdf = Buffer.from('%PDF-1.4 mock label for ' + reference);
        this.logger.warn(`Mock label generated for ${reference} — set SHIPPO_API_KEY for real labels`);
        return { trackingNumber, labelPdf };
    }

    // ─── Admin-managed settings ────────────────────────────────────────────────────

    async getSettings() {
        const [key, serviceLevel] = await Promise.all([
            this.getApiKey(),
            this.getServiceLevel(),
        ]);
        return {
            shippoApiKey:       this.settingsService.mask(key),
            shippoServiceLevel: serviceLevel,
        };
    }

    async updateSettings(dto: { shippoApiKey?: string; shippoServiceLevel?: string }) {
        const map: Record<string, string | undefined> = {
            SHIPPO_API_KEY:       dto.shippoApiKey,
            SHIPPO_SERVICE_LEVEL: dto.shippoServiceLevel,
        };
        await Promise.all(
            Object.entries(map)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([key, value]) => this.settingsService.set(key, value!)),
        );
        return this.getSettings();
    }

    async testConnection() {
        const key = await this.getApiKey();
        if (!key) throw new BadRequestException('Shippo API key is not configured');
        const res = await fetch(`${SHIPPO_BASE}/carrier_accounts/`, { headers: await this.getHeaders() });
        if (!res.ok) throw new BadRequestException(`Shippo connection failed (status ${res.status})`);
        return { ok: true };
    }
}
