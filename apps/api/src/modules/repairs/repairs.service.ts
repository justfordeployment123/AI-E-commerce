import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { SetQuoteDto } from './dto/set-quote.dto';
import { CompleteRepairDto } from './dto/complete-repair.dto';

@Injectable()
export class RepairsService {
    private readonly logger = new Logger(RepairsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly notifications: NotificationsService,
        private readonly shipping: ShippingService,
    ) {}

    async submit(dto: CreateRepairDto, userId?: string) {
        let contact: object = dto.contact as object;
        if (userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                contact = {
                    name:     user.name                          || (dto.contact as any).name     || '',
                    email:    user.email                         || (dto.contact as any).email    || '',
                    phone:    user.phone  || (dto.contact as any).phone    || '',
                    address:  user.address || (dto.contact as any).address || '',
                    postcode: (dto.contact as any).postcode      || '',
                };
            }
        }
        return this.prisma.repair.create({
            data: {
                userId,
                deviceType: dto.deviceType,
                brand: dto.brand,
                model: dto.model,
                issue: dto.issue,
                issueNotes: dto.issueNotes,
                fulfillment: dto.fulfillment,
                images: dto.images,
                contact,
            },
        });
    }

    async findAll(query: { status?: string; page?: number; limit?: number }) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = status ? { status: status as never } : {};

        const [items, total] = await Promise.all([
            this.prisma.repair.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, email: true } } },
            }),
            this.prisma.repair.count({ where }),
        ]);

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const repair = await this.prisma.repair.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        if (!repair) throw new NotFoundException('Repair not found');
        const imageUrls = await Promise.all(
            repair.images.map(key => this.storage.generatePresignedUrl(key).catch(() => null)),
        );
        return { ...repair, images: imageUrls.filter(Boolean) as string[] };
    }

    async findByReference(reference: string) {
        const repair = await this.prisma.repair.findUnique({ where: { reference } });
        if (!repair) throw new NotFoundException('Repair not found');
        return repair;
    }

    async findByUser(userId: string) {
        return this.prisma.repair.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async update(id: string, dto: UpdateRepairDto) {
        await this.findById(id);
        return this.prisma.repair.update({ where: { id }, data: dto as never });
    }

    async setQuote(id: string, dto: SetQuoteDto) {
        const repair = await this.findById(id);
        if (!['SUBMITTED', 'APPROVED'].includes(repair.status)) {
            throw new BadRequestException(`Cannot set quote on a repair with status ${repair.status}`);
        }
        const updated = await this.prisma.repair.update({
            where: { id },
            data: { status: 'QUOTE_SENT', quote: dto.quote, adminNotes: dto.adminNotes },
        });
        if (repair.userId) {
            await this.notifications.create(
                repair.userId,
                'repair_quote_sent',
                'Repair Quote Ready',
                `Your ${repair.brand} ${repair.model} repair quote is ready: £${dto.quote}. Log in to approve and proceed.`,
                { repairId: id, reference: repair.reference, quote: dto.quote },
            );
        }
        return updated;
    }

    async startRepair(id: string) {
        const repair = await this.findById(id);
        if (repair.status !== 'APPROVED') {
            throw new BadRequestException(`Cannot start a repair with status ${repair.status}`);
        }
        const updated = await this.prisma.repair.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
        if (repair.userId) {
            await this.notifications.create(
                repair.userId,
                'repair_in_progress',
                'Repair Started',
                `Your ${repair.brand} ${repair.model} repair is now in progress. We'll notify you when it's ready.`,
                { repairId: id, reference: repair.reference },
            );
        }
        return updated;
    }

    async completeRepair(id: string, dto: CompleteRepairDto) {
        const repair = await this.findById(id);
        if (repair.status !== 'IN_PROGRESS') {
            throw new BadRequestException(`Cannot complete a repair with status ${repair.status}`);
        }
        const updated = await this.prisma.repair.update({
            where: { id },
            data: { status: 'COMPLETED', adminNotes: dto.adminNotes ?? repair.adminNotes },
        });
        if (repair.userId) {
            await this.notifications.create(
                repair.userId,
                'repair_completed',
                'Repair Complete!',
                `Your ${repair.brand} ${repair.model} repair is done and ready for collection or dispatch.`,
                { repairId: id, reference: repair.reference },
            );
        }
        return updated;
    }

    async findByIdForUser(id: string, userId: string) {
        const repair = await this.prisma.repair.findFirst({ where: { id, userId } });
        if (!repair) throw new NotFoundException('Repair not found');
        const imageUrls = await Promise.all(
            repair.images.map(key => this.storage.generatePresignedUrl(key).catch(() => null)),
        );
        return { ...repair, images: imageUrls.filter(Boolean) as string[] };
    }

    async acceptQuote(id: string, userId: string) {
        const repair = await this.prisma.repair.findFirst({ where: { id, userId } });
        if (!repair) throw new NotFoundException('Repair not found');
        if (repair.status !== 'QUOTE_SENT') {
            throw new BadRequestException('No quote to accept');
        }

        const updated = await this.prisma.repair.update({ where: { id }, data: { status: 'APPROVED' } });

        // Generate prepaid label for mail-in repairs
        if (repair.fulfillment === 'ship') {
            const contact = repair.contact as Record<string, string>;
            try {
                const result = await this.shipping.generatePrepaidLabel({
                    reference:     repair.reference,
                    customerName:  contact.name  || 'Customer',
                    customerEmail: contact.email || '',
                    customerPhone: contact.phone,
                    type:          'repair',
                });
                await this.prisma.repair.update({
                    where: { id },
                    data:  { trackingNumber: result.trackingNumber },
                });
                await this.shipping.sendLabelEmail(
                    { reference: repair.reference, customerName: contact.name || 'Customer', customerEmail: contact.email || '', type: 'repair' },
                    result,
                );
            } catch (err) {
                this.logger.error(`Failed to generate shipping label for repair ${id}`, err);
            }
        }

        return updated;
    }

    async declineQuote(id: string, userId: string) {
        const repair = await this.prisma.repair.findFirst({ where: { id, userId } });
        if (!repair) throw new NotFoundException('Repair not found');
        if (repair.status !== 'QUOTE_SENT') {
            throw new BadRequestException('No quote to decline');
        }
        const updated = await this.prisma.repair.update({ where: { id }, data: { status: 'CANCELLED' } });
        await this.notifications.create(
            userId,
            'repair_cancelled',
            'Repair Cancelled',
            `You declined the quote for your ${repair.brand} ${repair.model} repair. Contact us if you'd like to discuss further.`,
            { repairId: id, reference: repair.reference },
        );
        return updated;
    }

    async cancelRepair(id: string) {
        const repair = await this.findById(id);
        if (['COMPLETED', 'CANCELLED'].includes(repair.status)) {
            throw new BadRequestException(`Cannot cancel a repair with status ${repair.status}`);
        }
        const updated = await this.prisma.repair.update({ where: { id }, data: { status: 'CANCELLED' } });
        if (repair.userId) {
            await this.notifications.create(
                repair.userId,
                'repair_cancelled',
                'Repair Cancelled',
                `Your ${repair.brand} ${repair.model} repair request has been cancelled. Contact us if you have any questions.`,
                { repairId: id, reference: repair.reference },
            );
        }
        return updated;
    }
}
