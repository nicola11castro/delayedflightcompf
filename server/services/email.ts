import nodemailer from "nodemailer";
import type { Claim } from "@shared/schema";
import { delayReasons } from "@shared/appr";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
const user = process.env.SMTP_USER || process.env.EMAIL_USER;
const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;

export class EmailService {
  private transporter: nodemailer.Transporter | null;

  constructor() {
    this.transporter =
      host && user && pass
        ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
        : null;
    if (!this.transporter) {
      console.warn("[email] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS); outgoing emails will be skipped.");
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  private async send(mail: { to: string; fromName?: string; template: EmailTemplate }): Promise<boolean> {
    if (!this.transporter) {
      console.log(`[email] skipped "${mail.template.subject}" -> ${mail.to} (SMTP not configured)`);
      return false;
    }
    await this.transporter.sendMail({
      from: `"${mail.fromName ?? "FlightClaim Pro"}" <${fromAddress}>`,
      to: mail.to,
      subject: mail.template.subject,
      html: mail.template.html,
      text: mail.template.text,
    });
    return true;
  }

  async sendClaimConfirmation(
    email: string,
    claimData: {
      claimId: string;
      passengerName: string;
      flightNumber: string;
      flightDate: string;
      estimatedCompensation?: number;
      commissionAmount?: number;
    },
  ): Promise<boolean> {
    return this.send({ to: email, template: this.getClaimConfirmationTemplate(claimData) });
  }

  async sendCommissionInvoice(
    email: string,
    invoiceData: {
      claimId: string;
      passengerName: string;
      compensationAmount: number;
      commissionAmount: number;
      paymentInstructions: string;
    },
  ): Promise<boolean> {
    return this.send({
      to: email,
      fromName: "FlightClaim Pro Billing",
      template: this.getCommissionInvoiceTemplate(invoiceData),
    });
  }

  async sendPaymentConfirmation(
    email: string,
    paymentData: {
      claimId: string;
      passengerName: string;
      amountReceived: number;
      commissionDeducted: number;
      finalAmount: number;
    },
  ): Promise<boolean> {
    return this.send({ to: email, template: this.getPaymentConfirmationTemplate(paymentData) });
  }

  async sendStatusUpdate(
    email: string,
    updateData: {
      claimId: string;
      passengerName: string;
      newStatus: string;
      statusMessage: string;
      nextSteps?: string;
    },
  ): Promise<boolean> {
    return this.send({ to: email, template: this.getStatusUpdateTemplate(updateData) });
  }

  /** Formal claim letter sent to an airline's claims inbox on behalf of the passenger. */
  async sendAirlineClaimLetter(to: string, claim: Claim): Promise<boolean> {
    return this.send({ to, fromName: "FlightClaim Pro Claims", template: this.getAirlineClaimLetterTemplate(claim) });
  }

  /** Marketing message to a user who opted in (CASL: always carries an unsubscribe line). */
  async sendMarketingEmail(
    to: string,
    campaign: { subject: string; message: string; firstName?: string | null },
  ): Promise<boolean> {
    return this.send({ to, template: this.getMarketingTemplate(campaign) });
  }

  private getClaimConfirmationTemplate(data: {
    claimId: string;
    passengerName: string;
    flightNumber: string;
    flightDate: string;
    estimatedCompensation?: number;
    commissionAmount?: number;
  }): EmailTemplate {
    const commissionText =
      data.estimatedCompensation && data.commissionAmount !== undefined
        ? `If successful, our 15% commission would be $${data.commissionAmount}, and you would receive $${data.estimatedCompensation - data.commissionAmount}.`
        : "Our 15% commission only applies if your claim is successful.";

    return {
      subject: `Claim Confirmation - ${data.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976D2;">Claim Submitted Successfully</h2>
          <p>Dear ${data.passengerName},</p>
          <p>Thank you for submitting your flight compensation claim. We've received your information and are now reviewing your case.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Claim Details</h3>
            <p><strong>Claim ID:</strong> ${data.claimId}</p>
            <p><strong>Flight:</strong> ${data.flightNumber} on ${data.flightDate}</p>
            <p><strong>Status:</strong> Submitted</p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Commission Structure</h3>
            <p>${commissionText}</p>
            <p><strong>No win, no fee guarantee</strong> - You only pay if we successfully recover compensation for you.</p>
          </div>

          <p>Keep your Claim ID safe: you can track your claim status at any time with it.</p>
          <p>Best regards,<br>FlightClaim Pro Team</p>
        </div>
      `,
      text: `Claim Confirmation - ${data.claimId}\n\nDear ${data.passengerName},\n\nYour flight compensation claim has been submitted successfully. Claim ID: ${data.claimId}\nFlight: ${data.flightNumber} on ${data.flightDate}\n\n${commissionText}\n\nKeep your Claim ID safe to track your claim status.`,
    };
  }

  private getCommissionInvoiceTemplate(data: {
    claimId: string;
    passengerName: string;
    compensationAmount: number;
    commissionAmount: number;
    paymentInstructions: string;
  }): EmailTemplate {
    return {
      subject: `Commission Invoice - Claim ${data.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9800;">Commission Payment Required</h2>
          <p>Dear ${data.passengerName},</p>
          <p>Great news! Your flight compensation claim has been successful. The airline has paid your compensation directly.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Summary</h3>
            <p><strong>Total Compensation:</strong> $${data.compensationAmount}</p>
            <p><strong>Our Commission (15%):</strong> $${data.commissionAmount}</p>
            <p><strong>Commission Due:</strong> $${data.commissionAmount}</p>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Instructions</h3>
            <p>${data.paymentInstructions}</p>
          </div>

          <p>Thank you for using FlightClaim Pro. We're glad we could help you recover your compensation!</p>
          <p>Best regards,<br>FlightClaim Pro Billing Team</p>
        </div>
      `,
      text: `Commission Invoice - Claim ${data.claimId}\n\nDear ${data.passengerName},\n\nYour claim was successful! Commission due: $${data.commissionAmount}\n\nPayment instructions: ${data.paymentInstructions}`,
    };
  }

  private getPaymentConfirmationTemplate(data: {
    claimId: string;
    passengerName: string;
    amountReceived: number;
    commissionDeducted: number;
    finalAmount: number;
  }): EmailTemplate {
    return {
      subject: `Payment Processed - Claim ${data.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388E3C;">Payment Processed Successfully</h2>
          <p>Dear ${data.passengerName},</p>
          <p>Your compensation has been processed and the funds are being transferred to your account.</p>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Breakdown</h3>
            <p><strong>Total Compensation Received:</strong> $${data.amountReceived}</p>
            <p><strong>Commission Deducted (15%):</strong> $${data.commissionDeducted}</p>
            <p><strong>Amount Transferred to You:</strong> $${data.finalAmount}</p>
          </div>

          <p>Funds should appear in your account within 1-2 business days.</p>
          <p>Thank you for choosing FlightClaim Pro!</p>
          <p>Best regards,<br>FlightClaim Pro Team</p>
        </div>
      `,
      text: `Payment Processed - Claim ${data.claimId}\n\nDear ${data.passengerName},\n\nYour compensation has been processed. You'll receive $${data.finalAmount} after our 15% commission of $${data.commissionDeducted}.`,
    };
  }

  private getStatusUpdateTemplate(data: {
    claimId: string;
    passengerName: string;
    newStatus: string;
    statusMessage: string;
    nextSteps?: string;
  }): EmailTemplate {
    return {
      subject: `Claim Update - ${data.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976D2;">Claim Status Update</h2>
          <p>Dear ${data.passengerName},</p>
          <p>We have an update on your flight compensation claim.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Status: ${data.newStatus}</h3>
            <p>${data.statusMessage}</p>
          </div>

          ${
            data.nextSteps
              ? `<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Next Steps</h3>
            <p>${data.nextSteps}</p>
          </div>`
              : ""
          }

          <p>You can track your claim progress anytime using Claim ID: ${data.claimId}</p>
          <p>Best regards,<br>FlightClaim Pro Team</p>
        </div>
      `,
      text: `Claim Update - ${data.claimId}\n\nDear ${data.passengerName},\n\nStatus: ${data.newStatus}\n${data.statusMessage}\n\n${data.nextSteps || ""}`,
    };
  }

  private getAirlineClaimLetterTemplate(claim: Claim): EmailTemplate {
    const reasonLabel = delayReasons.find((r) => r.value === claim.delayReason)?.label ?? claim.delayReason ?? "Not specified";
    const amount = claim.compensationAmount ? `$${Number(claim.compensationAmount).toFixed(0)} CAD` : "the amount prescribed by the APPR";
    const body = [
      `To whom it may concern,`,
      ``,
      `We represent ${claim.passengerName} (${claim.email}) under a signed Power of Attorney regarding flight ${claim.flightNumber} on ${claim.flightDate} from ${claim.departureAirport} to ${claim.arrivalAirport}.`,
      ``,
      `The passenger experienced a ${claim.issueType.replace("-", " ")} of ${claim.delayDuration ?? "3+"} hours. The reason communicated was: ${reasonLabel}. This falls within the carrier's control and is not safety-related, so compensation of ${amount} is owed under sections 19 and 20 of the Air Passenger Protection Regulations (SOR/2019-150).`,
      ``,
      `Please confirm receipt and respond within 30 days as required by the Regulations. Our file reference is ${claim.claimId}.`,
      ``,
      `Sincerely,`,
      `FlightClaim Pro Claims Team`,
    ];
    const text = body.join("\n");
    return {
      subject: `APPR compensation claim - ${claim.flightNumber} ${claim.flightDate} - ref ${claim.claimId}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; white-space: pre-line;">${text}</div>`,
      text,
    };
  }

  private getMarketingTemplate(campaign: { subject: string; message: string; firstName?: string | null }): EmailTemplate {
    const greeting = campaign.firstName ? `Hi ${campaign.firstName},` : "Hello,";
    const unsubscribe = "You are receiving this because you opted in to updates from FlightClaim Pro. To stop receiving these emails, reply with UNSUBSCRIBE or contact support@yulclaims.com.";
    return {
      subject: campaign.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${greeting}</p>
          <div style="white-space: pre-line;">${campaign.message}</div>
          <p>Best regards,<br>FlightClaim Pro Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">${unsubscribe}</p>
        </div>
      `,
      text: `${greeting}\n\n${campaign.message}\n\nBest regards,\nFlightClaim Pro Team\n\n${unsubscribe}`,
    };
  }
}

export const emailService = new EmailService();
