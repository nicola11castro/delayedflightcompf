import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
      },
    });
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
    }
  ): Promise<void> {
    const template = this.getClaimConfirmationTemplate(claimData);
    
    await this.transporter.sendMail({
      from: `"FlightClaim Pro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCommissionInvoice(
    email: string,
    invoiceData: {
      claimId: string;
      passengerName: string;
      compensationAmount: number;
      commissionAmount: number;
      paymentInstructions: string;
    }
  ): Promise<void> {
    const template = this.getCommissionInvoiceTemplate(invoiceData);
    
    await this.transporter.sendMail({
      from: `"FlightClaim Pro Billing" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
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
    }
  ): Promise<void> {
    const template = this.getPaymentConfirmationTemplate(paymentData);
    
    await this.transporter.sendMail({
      from: `"FlightClaim Pro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendStatusUpdate(
    email: string,
    updateData: {
      claimId: string;
      passengerName: string;
      newStatus: string;
      statusMessage: string;
      nextSteps?: string;
    }
  ): Promise<void> {
    const template = this.getStatusUpdateTemplate(updateData);
    
    await this.transporter.sendMail({
      from: `"FlightClaim Pro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getClaimConfirmationTemplate(data: any): EmailTemplate {
    const commissionText = data.estimatedCompensation 
      ? `If successful, our 15% commission would be $${data.commissionAmount}, and you would receive $${data.estimatedCompensation - data.commissionAmount}.`
      : 'Our 15% commission only applies if your claim is successful.';

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
            <p><strong>Status:</strong> Under Review</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Commission Structure</h3>
            <p>${commissionText}</p>
            <p><strong>No win, no fee guarantee</strong> - You only pay if we successfully recover compensation for you.</p>
          </div>
          
          <p>We'll keep you updated on the progress of your claim. You can track your claim status at any time using your Claim ID.</p>
          <p>Best regards,<br>FlightClaim Pro Team</p>
        </div>
      `,
      text: `Claim Confirmation - ${data.claimId}\n\nDear ${data.passengerName},\n\nYour flight compensation claim has been submitted successfully. Claim ID: ${data.claimId}\nFlight: ${data.flightNumber} on ${data.flightDate}\n\n${commissionText}\n\nWe'll keep you updated on your claim progress.`
    };
  }

  private getCommissionInvoiceTemplate(data: any): EmailTemplate {
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
      text: `Commission Invoice - Claim ${data.claimId}\n\nDear ${data.passengerName},\n\nYour claim was successful! Commission due: $${data.commissionAmount}\n\nPayment instructions: ${data.paymentInstructions}`
    };
  }

  private getPaymentConfirmationTemplate(data: any): EmailTemplate {
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
      text: `Payment Processed - Claim ${data.claimId}\n\nDear ${data.passengerName},\n\nYour compensation has been processed. You'll receive $${data.finalAmount} after our 15% commission of $${data.commissionDeducted}.`
    };
  }

  private getStatusUpdateTemplate(data: any): EmailTemplate {
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
          
          ${data.nextSteps ? `<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Next Steps</h3>
            <p>${data.nextSteps}</p>
          </div>` : ''}
          
          <p>You can track your claim progress anytime using Claim ID: ${data.claimId}</p>
          <p>Best regards,<br>FlightClaim Pro Team</p>
        </div>
      `,
      text: `Claim Update - ${data.claimId}\n\nDear ${data.passengerName},\n\nStatus: ${data.newStatus}\n${data.statusMessage}\n\n${data.nextSteps || ''}`
    };
  }
}

export const emailService = new EmailService();
