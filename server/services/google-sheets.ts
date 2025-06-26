interface GoogleSheetsConfig {
  spreadsheetId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

interface ClaimRowData {
  claimId: string;
  passengerName: string;
  email: string;
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  issueType: string;
  delayDuration: string;
  delayReason: string;
  status: string;
  compensationAmount?: number;
  commissionAmount?: number;
  poaRequested: boolean;
  poaSigned: boolean;
  poaConsent: boolean;
  emailMarketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor() {
    this.config = {
      spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
    };
  }

  private async getAccessToken(): Promise<string> {
    // Simple JWT creation for service account authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Note: In production, use a proper JWT library like 'jsonwebtoken'
    // For now, we'll return a placeholder that would need proper implementation
    return 'placeholder_token';
  }

  async exportClaimsToSheet(claims: any[]): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      // Clear existing data and add headers
      const headers = [
        'Claim ID', 'Passenger Name', 'Email', 'Flight Number', 'Flight Date',
        'Departure Airport', 'Arrival Airport', 'Issue Type', 'Delay Duration',
        'Delay Reason', 'Status', 'Compensation Amount', 'Commission Amount',
        'POA Requested', 'POA Signed', 'POA Consent', 'Email Marketing Consent',
        'Created At', 'Updated At'
      ];

      const values = [
        headers,
        ...claims.map(claim => [
          claim.claimId,
          claim.passengerName,
          claim.email,
          claim.flightNumber,
          claim.flightDate,
          claim.departureAirport,
          claim.arrivalAirport,
          claim.issueType,
          claim.delayDuration,
          claim.delayReason,
          claim.status,
          claim.compensationAmount?.toString() || '',
          claim.commissionAmount?.toString() || '',
          claim.poaRequested.toString(),
          claim.poaSigned.toString(),
          claim.poaConsent.toString(),
          claim.emailMarketingConsent.toString(),
          claim.createdAt,
          claim.updatedAt,
        ])
      ];

      const response = await fetch(
        `${this.baseUrl}/${this.config.spreadsheetId}/values/Claims!A:S:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Add new data
      const updateResponse = await fetch(
        `${this.baseUrl}/${this.config.spreadsheetId}/values/Claims!A1`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            values: values,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update Google Sheets');
      }

      return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`;
    } catch (error) {
      console.error('Google Sheets export error:', error);
      throw new Error('Failed to export to Google Sheets');
    }
  }

  async appendClaimToSheet(claim: ClaimRowData): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const values = [[
        claim.claimId,
        claim.passengerName,
        claim.email,
        claim.flightNumber,
        claim.flightDate,
        claim.departureAirport,
        claim.arrivalAirport,
        claim.issueType,
        claim.delayDuration,
        claim.delayReason,
        claim.status,
        claim.compensationAmount?.toString() || '',
        claim.commissionAmount?.toString() || '',
        claim.poaRequested.toString(),
        claim.poaSigned.toString(),
        claim.poaConsent.toString(),
        claim.emailMarketingConsent.toString(),
        claim.createdAt,
        claim.updatedAt,
      ]];

      const response = await fetch(
        `${this.baseUrl}/${this.config.spreadsheetId}/values/Claims!A:S:append`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            values: values,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to append to Google Sheets');
      }
    } catch (error) {
      console.error('Google Sheets append error:', error);
      throw new Error('Failed to append to Google Sheets');
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();