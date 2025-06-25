interface AirtableConfig {
  baseId: string;
  apiKey: string;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export class AirtableService {
  private config: AirtableConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      baseId: process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID_ENV_VAR || "",
      apiKey: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY_ENV_VAR || ""
    };
    this.baseUrl = `https://api.airtable.com/v0/${this.config.baseId}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createClaimRecord(claim: any): Promise<AirtableRecord> {
    const fields = {
      'Claim ID': claim.claimId,
      'Passenger Name': claim.passengerName,
      'Email': claim.email,
      'Flight Number': claim.flightNumber,
      'Flight Date': claim.flightDate,
      'Departure Airport': claim.departureAirport,
      'Arrival Airport': claim.arrivalAirport,
      'Issue Type': claim.issueType,
      'Delay Duration': claim.delayDuration || '',
      'Delay Reason': claim.delayReason || '',
      'Status': claim.status,
      'POA Requested': claim.poaRequested,
      'POA Signed': claim.poaSigned,
      'Compensation Amount': claim.compensationAmount ? parseFloat(claim.compensationAmount) : 0,
      'Commission Amount': claim.commissionAmount ? parseFloat(claim.commissionAmount) : 0,
      'Created At': new Date().toISOString(),
    };

    const response = await this.makeRequest('/Claims', {
      method: 'POST',
      body: JSON.stringify({
        fields,
        typecast: true,
      }),
    });

    return response;
  }

  async updateClaimRecord(claimId: string, updates: Record<string, any>): Promise<AirtableRecord> {
    // First, find the record by claim ID
    const records = await this.getClaimRecords();
    const record = records.find(r => r.fields['Claim ID'] === claimId);
    
    if (!record) {
      throw new Error(`Claim record not found: ${claimId}`);
    }

    const response = await this.makeRequest(`/Claims/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: updates,
        typecast: true,
      }),
    });

    return response;
  }

  async getClaimRecords(): Promise<AirtableRecord[]> {
    const response = await this.makeRequest('/Claims');
    return response.records || [];
  }

  async createPaymentRecord(claimId: string, paymentData: {
    passengerEmail: string;
    compensationAmount: number;
    commissionAmount: number;
    paymentMethod: string;
    status: string;
  }): Promise<AirtableRecord> {
    const fields = {
      'Claim ID': claimId,
      'Passenger Email': paymentData.passengerEmail,
      'Compensation Amount': paymentData.compensationAmount,
      'Commission Amount': paymentData.commissionAmount,
      'Payment Method': paymentData.paymentMethod,
      'Status': paymentData.status,
      'Created At': new Date().toISOString(),
    };

    const response = await this.makeRequest('/Payments', {
      method: 'POST',
      body: JSON.stringify({
        fields,
        typecast: true,
      }),
    });

    return response;
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    // Note: Airtable file uploads require a different approach
    // This is a simplified implementation that would need to be enhanced
    // with proper file upload handling via Airtable's attachment fields
    
    // For now, return a placeholder URL
    // In production, you'd implement proper file upload to Airtable attachments
    return `https://airtable-uploads.example.com/${filename}`;
  }

  async calculateCommissionMetrics(): Promise<{
    totalClaims: number;
    totalCommissions: number;
    averageCommission: number;
    successRate: number;
  }> {
    try {
      const claims = await this.getClaimRecords();
      const successfulClaims = claims.filter(c => c.fields['Status'] === 'paid');
      
      const totalCommissions = successfulClaims.reduce((sum, claim) => {
        return sum + (parseFloat(claim.fields['Commission Amount']) || 0);
      }, 0);

      return {
        totalClaims: claims.length,
        totalCommissions,
        averageCommission: successfulClaims.length > 0 ? totalCommissions / successfulClaims.length : 0,
        successRate: claims.length > 0 ? (successfulClaims.length / claims.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Error calculating commission metrics:', error);
      return {
        totalClaims: 0,
        totalCommissions: 0,
        averageCommission: 0,
        successRate: 0,
      };
    }
  }
}

export const airtableService = new AirtableService();
