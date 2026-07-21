import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

function makeChat(overrides: Partial<any> = {}) {
    return {
        id: 'chat-1',
        guestName: 'Jane Doe',
        guestEmail: 'jane@example.com',
        orderRef: null,
        status: 'open',
        messages: [],
        ...overrides,
    };
}

describe('SupportService', () => {
    let service: SupportService;
    let prismaMock: any;
    let settingsMock: any;

    beforeEach(async () => {
        settingsMock = {
            get: jest.fn<() => Promise<any>>().mockResolvedValue(null),
            set: jest.fn<() => Promise<any>>(),
        };

        prismaMock = {
            helplineNumber: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            supportChat: {
                create: jest.fn<() => Promise<any>>(),
                findUnique: jest.fn<() => Promise<any>>(),
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                update: jest.fn<() => Promise<any>>(),
            },
            chatMessage: {
                create: jest.fn<() => Promise<any>>(),
            },
            $transaction: jest.fn<() => Promise<any>>(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupportService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: SettingsService, useValue: settingsMock },
            ],
        }).compile();

        service = module.get<SupportService>(SupportService);
    });

    describe('getContactEmail', () => {
        it('returns null when no setting is stored, with no hardcoded fallback', async () => {
            settingsMock.get.mockResolvedValueOnce(null);
            const email = await service.getContactEmail();
            expect(settingsMock.get).toHaveBeenCalledWith('SUPPORT_EMAIL');
            expect(email).toBeNull();
        });

        it('returns the stored setting when present', async () => {
            settingsMock.get.mockResolvedValueOnce('techstopuk@outlook.com');
            const email = await service.getContactEmail();
            expect(email).toBe('techstopuk@outlook.com');
        });
    });

    describe('updateContactEmail', () => {
        it('persists the new email via SettingsService', async () => {
            const result = await service.updateContactEmail('new@example.com');
            expect(settingsMock.set).toHaveBeenCalledWith('SUPPORT_EMAIL', 'new@example.com');
            expect(result).toEqual({ email: 'new@example.com' });
        });
    });

    describe('getHelplines', () => {
        it('queries only active helplines ordered by order', async () => {
            await service.getHelplines();
            expect(prismaMock.helplineNumber.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            });
        });
    });

    describe('getAllHelplines', () => {
        it('queries all helplines ordered by order', async () => {
            await service.getAllHelplines();
            expect(prismaMock.helplineNumber.findMany).toHaveBeenCalledWith({ orderBy: { order: 'asc' } });
        });
    });

    describe('createHelpline', () => {
        it('creates a helpline with the given dto', async () => {
            const dto = { label: 'Support', number: '0800 000 0000' };
            await service.createHelpline(dto);
            expect(prismaMock.helplineNumber.create).toHaveBeenCalledWith({ data: dto });
        });
    });

    describe('updateHelpline', () => {
        it('updates a helpline by id', async () => {
            await service.updateHelpline('h1', { isActive: false });
            expect(prismaMock.helplineNumber.update).toHaveBeenCalledWith({ where: { id: 'h1' }, data: { isActive: false } });
        });
    });

    describe('deleteHelpline', () => {
        it('deletes a helpline by id', async () => {
            await service.deleteHelpline('h1');
            expect(prismaMock.helplineNumber.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
        });
    });

    describe('createChat', () => {
        it('creates a chat including messages', async () => {
            const created = makeChat();
            prismaMock.supportChat.create.mockResolvedValueOnce(created);
            const result = await service.createChat('Jane Doe', 'jane@example.com', 'ORDER-1');
            expect(prismaMock.supportChat.create).toHaveBeenCalledWith({
                data: { guestName: 'Jane Doe', guestEmail: 'jane@example.com', orderRef: 'ORDER-1' },
                include: { messages: true },
            });
            expect(result).toBe(created);
        });
    });

    describe('getChat', () => {
        it('throws NotFoundException when the chat does not exist', async () => {
            prismaMock.supportChat.findUnique.mockResolvedValueOnce(null);
            await expect(service.getChat('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the chat with ordered messages when found', async () => {
            const chat = makeChat();
            prismaMock.supportChat.findUnique.mockResolvedValueOnce(chat);
            const result = await service.getChat('chat-1');
            expect(prismaMock.supportChat.findUnique).toHaveBeenCalledWith({
                where: { id: 'chat-1' },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            });
            expect(result).toBe(chat);
        });
    });

    describe('getAllChats', () => {
        it('returns all chats ordered by most recently updated', async () => {
            await service.getAllChats();
            expect(prismaMock.supportChat.findMany).toHaveBeenCalledWith({
                orderBy: { updatedAt: 'desc' },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
        });
    });

    describe('closeChat', () => {
        it('sets the chat status to closed', async () => {
            const closed = makeChat({ status: 'closed' });
            prismaMock.supportChat.update.mockResolvedValueOnce(closed);
            const result = await service.closeChat('chat-1');
            expect(prismaMock.supportChat.update).toHaveBeenCalledWith({ where: { id: 'chat-1' }, data: { status: 'closed' } });
            expect(result).toBe(closed);
        });
    });

    describe('addMessage', () => {
        it('creates the message and touches the chat in a single transaction, returning the message', async () => {
            const message = { id: 'msg-1', chatId: 'chat-1', sender: 'customer', body: 'Hello' };
            prismaMock.$transaction.mockResolvedValueOnce([message, makeChat()]);

            const result = await service.addMessage('chat-1', 'customer', 'Hello');

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
            expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({ data: { chatId: 'chat-1', sender: 'customer', body: 'Hello' } });
            expect(result).toBe(message);
        });
    });
});
