import { createSign } from 'crypto';

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
  mealVouchers: string;
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

  isConfigured(): boolean {
    return Boolean(
      this.config.spreadsheetId && this.config.credentials.client_email && this.config.credentials.private_key,
    );
  }

  /** Service-account JWT exchanged for a short-lived OAuth token (no extra dependency). */
  private async getAccessToken(): Promise<string> {
    const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(
      JSON.stringify({
        iss: this.config.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      }),
    );
    const signature = createSign('RSA-SHA256')
      .update(`${header}.${payload}`)
      .sign(this.config.credentials.private_key, 'base64url');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${header}.${payload}.${signature}`,
      }),
    });
    if (!response.ok) {
      throw new Error(`Google auth failed: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
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