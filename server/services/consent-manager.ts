import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

export interface ConsentRecord {
  consentType: string;
  userEmail: string;
  userName: string;
  claimId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  documentVersion: string;
  agreed: boolean;
}

export interface ConsentDocument {
  type: string;
  title: string;
  content: string;
  version: string;
  mandatory: boolean;
  category: 'registration' | 'claim' | 'marketing';
}

export class ConsentManager {
  private consentDocsPath = './consent-documents';
  private consentRecordsPath = './consent-records';

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.consentDocsPath, { recursive: true });
      await fs.mkdir(this.consentRecordsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating consent directories:', error);
    }
  }

  // Generate standardized consent documents
  async generateConsentDocuments() {
    const documents: ConsentDocument[] = [
      {
        type: 'terms',
        title: 'Terms of Service',
        content: this.getTermsContent(),
        version: '1.0',
        mandatory: true,
        category: 'registration'
      },
      {
        type: 'privacy',
        title: 'Privacy Policy',
        content: this.getPrivacyContent(),
        version: '1.0',
        mandatory: true,
        category: 'registration'
      },
      {
        type: 'dataRetention',
        title: 'Data Retention Policy',
        content: this.getDataRetentionContent(),
        version: '1.0',
        mandatory: true,
        category: 'registration'
      },
      {
        type: 'poa',
        title: 'Power of Attorney Agreement',
        content: this.getPOAContent(),
        version: '1.0',
        mandatory: true,
        category: 'claim'
      },
      {
        type: 'emailMarketing',
        title: 'Email Marketing Consent',
        content: this.getEmailMarketingContent(),
        version: '1.0',
        mandatory: false,
        category: 'marketing'
      }
    ];

    for (const doc of documents) {
      await this.saveConsentDocument(doc);
    }

    return documents;
  }

  // Save consent document as a file
  private async saveConsentDocument(document: ConsentDocument) {
    const filename = `${document.type}_v${document.version}.md`;
    const filepath = path.join(this.consentDocsPath, filename);
    
    const content = `# ${document.title}
Version: ${document.version}
Category: ${document.category}
Mandatory: ${document.mandatory}
Generated: ${new Date().toISOString()}

---

${document.content}`;

    await fs.writeFile(filepath, content, 'utf-8');
  }

  // Record user consent with detailed tracking
  async recordConsent(record: ConsentRecord): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const sanitizedEmail = record.userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
    const sanitizedName = record.userName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
    
    // Generate unique filename: ConsentType_FirstName_LastName_Email_ClaimID_Timestamp.json
    const filename = [
      record.consentType,
      sanitizedName,
      sanitizedEmail,
      record.claimId || 'NO_CLAIM',
      timestamp
    ].join('_') + '.json';

    const filepath = path.join(this.consentRecordsPath, filename);
    
    const fullRecord = {
      ...record,
      filename,
      recordedAt: new Date().toISOString(),
      documentPath: path.join(this.consentDocsPath, `${record.consentType}_v${record.documentVersion}.md`)
    };

    await fs.writeFile(filepath, JSON.stringify(fullRecord, null, 2), 'utf-8');
    
    return filename;
  }

  // Generate audit trail for a user
  async generateUserAuditTrail(userEmail: string): Promise<ConsentRecord[]> {
    try {
      const files = await fs.readdir(this.consentRecordsPath);
      const userFiles = files.filter(file => file.includes(userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_')));
      
      const records: ConsentRecord[] = [];
      for (const file of userFiles) {
        const content = await fs.readFile(path.join(this.consentRecordsPath, file), 'utf-8');
        records.push(JSON.parse(content));
      }
      
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error generating audit trail:', error);
      return [];
    }
  }

  // Export all consent records for compliance
  async exportConsentRecords(startDate?: Date, endDate?: Date): Promise<ConsentRecord[]> {
    try {
      const files = await fs.readdir(this.consentRecordsPath);
      const records: ConsentRecord[] = [];
      
      for (const file of files) {
        const content = await fs.readFile(path.join(this.consentRecordsPath, file), 'utf-8');
        const record = JSON.parse(content);
        
        const recordDate = new Date(record.timestamp);
        if (startDate && recordDate < startDate) continue;
        if (endDate && recordDate > endDate) continue;
        
        records.push(record);
      }
      
      return records;
    } catch (error) {
      console.error('Error exporting consent records:', error);
      return [];
    }
  }

  // Validate consent status for a user
  async validateUserConsent(userEmail: string, requiredConsents: string[]): Promise<{
    valid: boolean;
    missing: string[];
    records: ConsentRecord[];
  }> {
    const userRecords = await this.generateUserAuditTrail(userEmail);
    const validConsents = userRecords
      .filter(record => record.agreed)
      .map(record => record.consentType);
    
    const missing = requiredConsents.filter(consent => !validConsents.includes(consent));
    
    return {
      valid: missing.length === 0,
      missing,
      records: userRecords
    };
  }

  // Content generators for each consent type
  private getTermsContent(): string {
    return `## 1. Service Description
YUL Flight Delay Compensation helps passengers claim APPR compensation for flight delays at Montreal-Trudeau (YUL) and other Canadian airports.

## 2. Commission Structure
We charge a 15% commission on successful claims only. No win, no fee.

## 3. User Responsibilities
- Provide accurate flight information
- Submit required documentation
- Respond to our communications promptly

## 4. Limitation of Liability
Our liability is limited to the amount of commission received for your specific claim.

## 5. Governing Law
These terms are governed by Quebec law and Canadian federal regulations.

## 6. Acceptance
By checking this box, you agree to these terms of service.`;
  }

  private getPrivacyContent(): string {
    return `## 1. Information Collection
We collect flight details, personal information, and supporting documents necessary for APPR claims.

## 2. Use of Information
Your information is used solely to process compensation claims and communicate with you about your claim status.

## 3. Information Sharing
We share your information only with airlines and regulatory authorities as required for claim processing.

## 4. Data Security
We use industry-standard encryption and security measures to protect your personal information.

## 5. Your Rights
You may request access, correction, or deletion of your personal information subject to regulatory requirements.

## 6. Compliance
This policy complies with PIPEDA and Quebec's Law 25 privacy regulations.

## 7. Acceptance
By checking this box, you consent to our privacy policy.`;
  }

  private getDataRetentionContent(): string {
    return `## 1. Retention Period
Claim data is retained for 1 year minimum per APPR requirements, even if you delete your account.

## 2. Personal Data Deletion
You may request deletion of personal information (name, email), but claim-related data must be retained for regulatory compliance.

## 3. Regulatory Requirements
APPR regulations require airlines and service providers to maintain claim records for audit purposes.

## 4. Your Rights
Contact support@yulclaims.com to request personal data deletion or access your retained information.

## 5. Legal Compliance
This policy ensures compliance with Canadian federal regulations and Quebec provincial law.

## 6. Acceptance
By checking this box, you acknowledge and consent to our data retention practices.`;
  }

  private getPOAContent(): string {
    return `## 1. Authorization Scope
You authorize YUL Flight Delay Compensation to act on your behalf for APPR compensation claims related to your specified flight delay.

## 2. Authorized Actions
We may submit claims, negotiate with airlines, communicate with regulators, and collect compensation on your behalf.

## 3. Commission Agreement
We will deduct our 15% commission from any compensation received and remit the balance (85%) to you.

## 4. Revocation
You may revoke this authorization with 7 days written notice to support@yulclaims.com.

## 5. Legal Compliance
This agreement complies with Quebec's Civil Code and Consumer Protection Act requirements.

## 6. Digital Signature
Your electronic consent constitutes a valid digital signature under Quebec law.

## 7. Acceptance
By checking this box, you grant us power of attorney for your compensation claim.`;
  }

  private getEmailMarketingContent(): string {
    return `## 1. Marketing Communications
We may send you updates about flight compensation rights, new services, and relevant travel information.

## 2. Frequency
Marketing emails will be sent no more than once per week, with seasonal updates as appropriate.

## 3. Opt-Out
You may unsubscribe at any time using the link in our emails or by contacting support@yulclaims.com.

## 4. Content
Communications will focus on passenger rights education and service updates relevant to flight compensation.

## 5. Data Use
We will not share your email with third parties for marketing purposes.

## 6. Compliance
This consent complies with CASL (Canada's Anti-Spam Legislation) requirements.

## 7. Acceptance
By checking this box, you consent to receive marketing communications from us.`;
  }
}

export const consentManager = new ConsentManager();