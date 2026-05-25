import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
            port:   Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendShippingLabel(opts: {
        to:             string;
        customerName:   string;
        reference:      string;
        trackingNumber: string;
        type:           'repair' | 'trade-in';
        labelPdf:       Buffer;
    }) {
        const subject = opts.type === 'repair'
            ? `Your prepaid return label — Repair ${opts.reference}`
            : `Your prepaid shipping label — Trade-In ${opts.reference}`;

        const body = opts.type === 'repair'
            ? `Hi ${opts.customerName},\n\nYour repair quote has been approved. Please use the attached prepaid Royal Mail label to send your device to us.\n\nTracking number: ${opts.trackingNumber}\n\nSimply print the label, attach it to your securely packaged device, and drop it at any Post Office or Royal Mail collection point.\n\nWe'll notify you as soon as we receive it and begin the repair.\n\nThanks,\nTechStop Leicester`
            : `Hi ${opts.customerName},\n\nYour trade-in has been approved. Please use the attached prepaid Royal Mail label to send your device to us.\n\nTracking number: ${opts.trackingNumber}\n\nSimply print the label, attach it to your securely packaged device, and drop it at any Post Office or Royal Mail collection point.\n\nWe'll process your trade-in as soon as we receive it.\n\nThanks,\nTechStop Leicester`;

        try {
            await this.transporter.sendMail({
                from:    `"TechStop Leicester" <${process.env.SMTP_USER}>`,
                to:      opts.to,
                subject,
                text:    body,
                attachments: [{
                    filename:    `label-${opts.reference}.pdf`,
                    content:     opts.labelPdf,
                    contentType: 'application/pdf',
                }],
            });
            this.logger.log(`Shipping label email sent to ${opts.to} for ${opts.reference}`);
        } catch (err) {
            this.logger.error(`Failed to send shipping label email to ${opts.to}`, err);
        }
    }
}
