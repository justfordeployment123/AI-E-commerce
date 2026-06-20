import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';

const PLAINTEXT_KEYS = new Set(['STRIPE_MODE']);

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);
    private readonly cache = new Map<string, string>();
    private encKey: Buffer = Buffer.alloc(32);

    constructor(private readonly prisma: PrismaService) {}

    onModuleInit() {
        const hex = process.env.ENCRYPTION_KEY ?? '';
        if (hex.length !== 64) {
            this.logger.warn('ENCRYPTION_KEY is missing or not 64 hex chars — encrypted settings will not work');
            this.encKey = Buffer.alloc(32);
        } else {
            this.encKey = Buffer.from(hex, 'hex');
        }
    }

    private encrypt(plaintext: string): string {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    private decrypt(stored: string): string {
        const parts = stored.split(':');
        const ivHex = parts[0] ?? '';
        const authTagHex = parts[1] ?? '';
        const ctHex = parts[2] ?? '';
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const ct = Buffer.from(ctHex, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', this.encKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    }

    async get(key: string): Promise<string | null> {
        if (this.cache.has(key)) return this.cache.get(key)!;

        const row = await this.prisma.appSetting.findUnique({ where: { key } });
        if (row) {
            let value: string;
            if (PLAINTEXT_KEYS.has(key)) {
                value = row.encryptedValue;
            } else {
                try {
                    value = this.decrypt(row.encryptedValue);
                } catch (err) {
                    this.logger.error(`Failed to decrypt setting "${key}" — row may be corrupted`, err);
                    return null;
                }
            }
            this.cache.set(key, value);
            return value;
        }

        const envVal = process.env[key] ?? null;
        if (envVal) this.cache.set(key, envVal);
        return envVal;
    }

    async set(key: string, plaintext: string): Promise<void> {
        const stored = PLAINTEXT_KEYS.has(key) ? plaintext : this.encrypt(plaintext);
        await this.prisma.appSetting.upsert({
            where: { key },
            update: { encryptedValue: stored },
            create: { key, encryptedValue: stored },
        });
        this.cache.delete(key);
    }

    mask(value: string | null): string | null {
        if (!value) return null;
        const lastUnderscore = value.lastIndexOf('_');
        const prefix = lastUnderscore >= 0 ? value.slice(0, lastUnderscore + 1) : '';
        return `${prefix}****${value.slice(-4)}`;
    }
}
