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

    async sendOrderConfirmation(opts: {
        to: string;
        customerName: string;
        orderId: string;
        items: { name: string; quantity: number; price: number }[];
        subtotal: number;
        shipping: number;
        total: number;
        shippingAddress: { name: string; address: string; city: string; postcode: string; country: string };
    }) {
        const ref = opts.orderId.slice(0, 8).toUpperCase();
        const itemRows = opts.items
            .map(i => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111">${i.name}</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;text-align:center">×${i.quantity}</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;text-align:right">£${(i.price * i.quantity).toFixed(2)}</td>
              </tr>`)
            .join('');

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#000;padding:32px 40px;text-align:center">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">TECHSTOP<span style="color:#c3eb4e">LEICESTER</span></p>
        </td></tr>

        <!-- Check icon + title -->
        <tr><td style="padding:40px 40px 24px;text-align:center">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:#c3eb4e;border-radius:20px;margin-bottom:20px">
            <span style="font-size:36px">✓</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111">Order confirmed!</h1>
          <p style="margin:0;color:#666;font-size:15px">Hi ${opts.customerName}, your order is on its way.</p>
        </td></tr>

        <!-- Order ref -->
        <tr><td style="padding:0 40px 24px">
          <div style="background:#f5f5f7;border-radius:14px;padding:16px 20px;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase">Order reference</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#111">#${ref}</p>
          </div>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase">Items ordered</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
            <tr>
              <td style="font-size:13px;color:#666;padding:4px 0">Subtotal</td>
              <td style="font-size:13px;color:#666;padding:4px 0;text-align:right">£${opts.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#666;padding:4px 0">Delivery</td>
              <td style="font-size:13px;color:#16a34a;font-weight:700;padding:4px 0;text-align:right">${opts.shipping === 0 ? 'Free' : '£' + opts.shipping.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:700;color:#111;padding:10px 0 4px;border-top:2px solid #111">Total</td>
              <td style="font-size:16px;font-weight:700;color:#111;padding:10px 0 4px;text-align:right;border-top:2px solid #111">£${opts.total.toFixed(2)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Shipping address -->
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase">Delivering to</p>
          <p style="margin:0;font-size:14px;color:#111;line-height:1.6">
            ${opts.shippingAddress.name}<br>
            ${opts.shippingAddress.address}<br>
            ${opts.shippingAddress.city}, ${opts.shippingAddress.postcode}<br>
            ${opts.shippingAddress.country}
          </p>
        </td></tr>

        <!-- Next steps -->
        <tr><td style="padding:0 40px 32px">
          <div style="background:#f5f5f7;border-radius:14px;padding:20px">
            <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase">What happens next</p>
            ${[
              ['1', 'Dispatched within 24 hours via Royal Mail Tracked 24'],
              ['2', 'Tracking number emailed once dispatched'],
              ['3', 'Delivered in 1–2 working days'],
            ].map(([n, t]) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              <div style="width:28px;height:28px;background:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:28px">
                <span style="color:#fff;font-weight:700;font-size:12px">${n}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#444;font-weight:500">${t}</p>
            </div>`).join('')}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f5f7;padding:20px 40px;text-align:center;border-top:1px solid #eee">
          <p style="margin:0;font-size:12px;color:#999">Questions? Reply to this email or visit <a href="https://techstopleicester.com" style="color:#111;font-weight:700">techstopleicester.com</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#bbb">© TechStop Leicester</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

        try {
            await this.transporter.sendMail({
                from:    `"TechStop Leicester" <${process.env.SMTP_USER}>`,
                to:      opts.to,
                subject: `Order confirmed #${ref} — TechStop Leicester`,
                html,
                text: `Hi ${opts.customerName},\n\nYour order #${ref} is confirmed and will be dispatched within 24 hours.\n\nTotal: £${opts.total.toFixed(2)}\n\nDelivering to:\n${opts.shippingAddress.name}\n${opts.shippingAddress.address}\n${opts.shippingAddress.city} ${opts.shippingAddress.postcode}\n\nThanks,\nTechStop Leicester`,
            });
            this.logger.log(`Order confirmation email sent to ${opts.to} for order ${opts.orderId}`);
        } catch (err) {
            this.logger.error(`Failed to send order confirmation email to ${opts.to}`, err);
        }
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
