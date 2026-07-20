import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { ShippingService, ShipmentRequest } from './shipping.service';
import { EmailService } from '../../common/services/email.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

function makeSettingsMock(overrides: Record<string, string | null> = {}) {
    const values: Record<string, string | null> = {
        SHIPPO_MODE: 'test',
        SHIPPO_API_KEY_TEST: 'shippo_test_abc123',
        SHIPPO_API_KEY_LIVE: null,
        SHIPPO_SERVICE_LEVEL: null,
        ...overrides,
    };
    return {
        get: jest.fn(async (key: string) => values[key] ?? null),
        set: jest.fn<(key: string, value: string) => Promise<any>>(),
        mask: jest.fn((v: string | null) => (v ? `masked:${v.slice(-4)}` : null)),
    };
}

function makeRequest(overrides: Partial<ShipmentRequest> = {}): ShipmentRequest {
    return {
        reference: 'TI-1001',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '07000000000',
        type: 'trade-in',
        ...overrides,
    };
}

function jsonResponse(body: any, ok = true, status = 200) {
    return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as any;
}

describe('ShippingService', () => {
    let service: ShippingService;
    let prismaMock: any;
    let settingsMock: ReturnType<typeof makeSettingsMock>;
    let emailMock: any;
    let fetchMock: jest.Mock<any>;

    beforeEach(async () => {
        prismaMock = {
            store: { findFirst: jest.fn<() => Promise<any>>().mockResolvedValue(null) },
        };
        settingsMock = makeSettingsMock();
        emailMock = { sendShippingLabel: jest.fn<() => Promise<any>>() };
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShippingService,
                { provide: EmailService, useValue: emailMock },
                { provide: PrismaService, useValue: prismaMock },
                { provide: SettingsService, useValue: settingsMock },
            ],
        }).compile();

        service = module.get<ShippingService>(ShippingService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getHealthStatus', () => {
        it('reports configured=false and keyMode unknown when no key is set', async () => {
            settingsMock.get.mockImplementation(async () => null);
            const result = await service.getHealthStatus();
            expect(result).toEqual({ configured: false, mode: 'test', keyMode: 'unknown' });
        });

        it('reports keyMode test for a shippo_test_ prefixed key', async () => {
            const result = await service.getHealthStatus();
            expect(result).toEqual({ configured: true, mode: 'test', keyMode: 'test' });
        });

        it('reports keyMode live for a shippo_live_ prefixed key', async () => {
            settingsMock = makeSettingsMock({ SHIPPO_MODE: 'live', SHIPPO_API_KEY_LIVE: 'shippo_live_xyz' });
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    ShippingService,
                    { provide: EmailService, useValue: emailMock },
                    { provide: PrismaService, useValue: prismaMock },
                    { provide: SettingsService, useValue: settingsMock },
                ],
            }).compile();
            service = module.get<ShippingService>(ShippingService);

            const result = await service.getHealthStatus();
            expect(result).toEqual({ configured: true, mode: 'live', keyMode: 'live' });
        });
    });

    describe('generatePrepaidLabel', () => {
        it('returns a mock label when no API key is configured', async () => {
            settingsMock.get.mockImplementation(async () => null);
            const result = await service.generatePrepaidLabel(makeRequest());
            expect(result.trackingNumber).toMatch(/^MOCK.*GB$/);
            expect(result.labelPdf).toBeInstanceOf(Buffer);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('creates a shipment, buys a label, and downloads the PDF on success', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({
                    object_id: 'ship_1',
                    rates: [{ object_id: 'rate_1', servicelevel: { token: 'royalmail_tracked48' } }],
                }))
                .mockResolvedValueOnce(jsonResponse({
                    status: 'SUCCESS',
                    tracking_number: 'TRACK123',
                    label_url: 'https://labels.example.com/x.pdf',
                }))
                .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new TextEncoder().encode('%PDF-data').buffer });

            const result = await service.generatePrepaidLabel(makeRequest());

            expect(result.trackingNumber).toBe('TRACK123');
            expect(result.labelPdf).toBeInstanceOf(Buffer);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it('falls back to the first rate when the configured service level has no match', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({
                    object_id: 'ship_1',
                    rates: [{ object_id: 'rate_other', servicelevel: { token: 'some_other_level' } }],
                }))
                .mockResolvedValueOnce(jsonResponse({
                    status: 'SUCCESS',
                    tracking_number: 'TRACK999',
                    label_url: 'https://labels.example.com/y.pdf',
                }))
                .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });

            const result = await service.generatePrepaidLabel(makeRequest());
            expect(result.trackingNumber).toBe('TRACK999');

            const txBody = JSON.parse((fetchMock.mock.calls[1]![1] as any).body);
            expect(txBody.rate).toBe('rate_other');
        });

        it('throws when shipment creation fails', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad request' }, false, 400));
            await expect(service.generatePrepaidLabel(makeRequest())).rejects.toThrow('Shippo API error: 400');
        });

        it('throws when no rates are returned', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ object_id: 'ship_1', rates: [] }));
            await expect(service.generatePrepaidLabel(makeRequest())).rejects.toThrow('No shipping rates available');
        });

        it('throws when the transaction purchase fails', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({
                    object_id: 'ship_1',
                    rates: [{ object_id: 'rate_1', servicelevel: { token: 'royalmail_tracked48' } }],
                }))
                .mockResolvedValueOnce(jsonResponse({ error: 'declined' }, false, 402));

            await expect(service.generatePrepaidLabel(makeRequest())).rejects.toThrow('Shippo transaction error: 402');
        });

        it('throws when the transaction status is not SUCCESS', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({
                    object_id: 'ship_1',
                    rates: [{ object_id: 'rate_1', servicelevel: { token: 'royalmail_tracked48' } }],
                }))
                .mockResolvedValueOnce(jsonResponse({ status: 'ERROR', tracking_number: '', label_url: '' }));

            await expect(service.generatePrepaidLabel(makeRequest())).rejects.toThrow('Shippo label generation failed');
        });

        it('throws when the label PDF download fails', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({
                    object_id: 'ship_1',
                    rates: [{ object_id: 'rate_1', servicelevel: { token: 'royalmail_tracked48' } }],
                }))
                .mockResolvedValueOnce(jsonResponse({
                    status: 'SUCCESS',
                    tracking_number: 'TRACK123',
                    label_url: 'https://labels.example.com/x.pdf',
                }))
                .mockResolvedValueOnce({ ok: false });

            await expect(service.generatePrepaidLabel(makeRequest())).rejects.toThrow('Failed to download label PDF from Shippo');
        });
    });

    describe('sendLabelEmail', () => {
        it('delegates to EmailService.sendShippingLabel with the mapped fields', async () => {
            const req = makeRequest();
            const result = { trackingNumber: 'TRACK123', labelPdf: Buffer.from('pdf') };
            await service.sendLabelEmail(req, result);
            expect(emailMock.sendShippingLabel).toHaveBeenCalledWith({
                to: req.customerEmail,
                customerName: req.customerName,
                reference: req.reference,
                trackingNumber: result.trackingNumber,
                type: req.type,
                labelPdf: result.labelPdf,
            });
        });
    });

    describe('trackShipment', () => {
        it('returns unknown/empty when no API key is configured', async () => {
            settingsMock.get.mockImplementation(async () => null);
            const result = await service.trackShipment('TRACK123');
            expect(result).toEqual({ status: 'unknown', events: [] });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns unknown/empty when the request fails', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false });
            const result = await service.trackShipment('TRACK123');
            expect(result).toEqual({ status: 'unknown', events: [] });
        });

        it('maps the tracking status and history on success', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({
                tracking_status: { status: 'DELIVERED' },
                tracking_history: [{ status: 'DELIVERED' }],
            }));
            const result = await service.trackShipment('TRACK123');
            expect(result).toEqual({ status: 'DELIVERED', events: [{ status: 'DELIVERED' }] });
        });
    });

    describe('getSettings', () => {
        it('returns masked keys and current config', async () => {
            const result = await service.getSettings();
            expect(result.mode).toBe('test');
            expect(result.shippoApiKeyTest).toBe('masked:c123');
            expect(result.shippoApiKeyLive).toBeNull();
        });
    });

    describe('updateSettings', () => {
        it('only persists defined, non-empty fields', async () => {
            await service.updateSettings({ mode: 'live', shippoApiKeyTest: '', shippoApiKeyLive: undefined });
            expect(settingsMock.set).toHaveBeenCalledTimes(1);
            expect(settingsMock.set).toHaveBeenCalledWith('SHIPPO_MODE', 'live');
        });

        it('returns the refreshed settings snapshot', async () => {
            const result = await service.updateSettings({ shippoServiceLevel: 'royalmail_tracked24' });
            expect(settingsMock.set).toHaveBeenCalledWith('SHIPPO_SERVICE_LEVEL', 'royalmail_tracked24');
            expect(result).toHaveProperty('mode');
        });
    });

    describe('testConnection', () => {
        it('throws BadRequestException when no API key is configured', async () => {
            settingsMock.get.mockImplementation(async () => null);
            await expect(service.testConnection()).rejects.toThrow(BadRequestException);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('throws BadRequestException when the connection check fails', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
            await expect(service.testConnection()).rejects.toThrow(BadRequestException);
        });

        it('returns ok:true when the connection check succeeds', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
            const result = await service.testConnection();
            expect(result).toEqual({ ok: true });
        });
    });
});
