interface DocuSignConfig {
  clientId: string;
  clientSecret: string;
  accountId: string;
  environment: string;
}

interface POASigningRequest {
  claimId: string;
  passengerName: string;
  passengerEmail: string;
  compensationAmount: number;
  commissionAmount: number;
}

interface SigningResponse {
  envelopeId: string;
  signingUrl: string;
  status: string;
}

export class DocuSignService {
  private config: DocuSignConfig;
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.config = {
      clientId: process.env.DOCUSIGN_CLIENT_ID || process.env.DOCUSIGN_CLIENT_ID_ENV_VAR || "",
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || process.env.DOCUSIGN_CLIENT_SECRET_ENV_VAR || "",
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || process.env.DOCUSIGN_ACCOUNT_ID_ENV_VAR || "",
      environment: process.env.DOCUSIGN_ENVIRONMENT || "demo"
    };
    this.baseUrl = this.config.environment === "production" 
      ? "https://www.docusign.net/restapi/v2.1" 
      : "https://demo.docusign.net/restapi/v2.1";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const authUrl = this.config.environment === "production"
      ? "https://account.docusign.com/oauth/token"
      : "https://account-d.docusign.com/oauth/token";

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=signature',
    });

    if (!response.ok) {
      throw new Error(`DocuSign auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    // Set token expiration handling
    setTimeout(() => {
      this.accessToken = null;
    }, (data.expires_in - 300) * 1000); // Refresh 5 minutes before expiry

    return this.accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/accounts/${this.config.accountId}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`DocuSign API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createPOAEnvelope(request: POASigningRequest): Promise<SigningResponse> {
    try {
      // Generate POA document content
      const documentContent = this.generatePOADocument(request);
      
      const envelopeDefinition = {
        emailSubject: `Power of Attorney - FlightClaim Pro (Claim: ${request.claimId})`,
        documents: [
          {
            documentBase64: Buffer.from(documentContent).toString('base64'),
            name: `POA_${request.claimId}.pdf`,
            fileExtension: 'pdf',
            documentId: '1',
          },
        ],
        recipients: {
          signers: [
            {
              email: request.passengerEmail,
              name: request.passengerName,
              recipientId: '1',
              tabs: {
                signHereTabs: [
                  {
                    documentId: '1',
                    pageNumber: '1',
                    xPosition: '400',
                    yPosition: '600',
                  },
                ],
                dateSignedTabs: [
                  {
                    documentId: '1',
                    pageNumber: '1',
                    xPosition: '400',
                    yPosition: '650',
                  },
                ],
              },
            },
          ],
        },
        status: 'sent',
      };

      const envelope = await this.makeRequest('/envelopes', {
        method: 'POST',
        body: JSON.stringify(envelopeDefinition),
      });

      // Get the signing URL
      const recipientView = await this.makeRequest(`/envelopes/${envelope.envelopeId}/views/recipient`, {
        method: 'POST',
        body: JSON.stringify({
          authenticationMethod: 'none',
          email: request.passengerEmail,
          recipientId: '1',
          returnUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/docusign/callback`,
          userName: request.passengerName,
        }),
      });

      return {
        envelopeId: envelope.envelopeId,
        signingUrl: recipientView.url,
        status: envelope.status,
      };
    } catch (error) {
      console.error('DocuSign POA creation error:', error);
      throw new Error('Failed to create Power of Attorney document');
    }
  }

  async getEnvelopeStatus(envelopeId: string): Promise<{
    status: string;
    completed: boolean;
    documentUrl?: string;
  }> {
    try {
      const envelope = await this.makeRequest(`/envelopes/${envelopeId}`);
      
      let documentUrl;
      if (envelope.status === 'completed') {
        // Get the completed document
        const docResponse = await this.makeRequest(`/envelopes/${envelopeId}/documents/combined`, {
          headers: {
            'Accept': 'application/pdf',
          },
        });
        
        // In a real implementation, you'd save this to cloud storage
        documentUrl = `https://storage.example.com/poa/${envelopeId}.pdf`;
      }

      return {
        status: envelope.status,
        completed: envelope.status === 'completed',
        documentUrl,
      };
    } catch (error) {
      console.error('DocuSign status check error:', error);
      return {
        status: 'error',
        completed: false,
      };
    }
  }

  private generatePOADocument(request: POASigningRequest): string {
    // This would generate an actual PDF document in production
    // For now, returning HTML that represents the POA content
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Power of Attorney - FlightClaim Pro</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { margin-bottom: 20px; }
          .signature-area { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>POWER OF ATTORNEY</h1>
          <h2>Flight Compensation Claim Authorization</h2>
        </div>
        
        <div class="content">
          <p><strong>Claim ID:</strong> ${request.claimId}</p>
          <p><strong>Passenger Name:</strong> ${request.passengerName}</p>
          <p><strong>Email:</strong> ${request.passengerEmail}</p>
          
          <h3>Authorization</h3>
          <p>I, ${request.passengerName}, hereby authorize FlightClaim Pro to act as my attorney-in-fact for the purpose of:</p>
          <ul>
            <li>Submitting and pursuing flight compensation claims on my behalf</li>
            <li>Collecting compensation payments directly from airlines</li>
            <li>Deducting the agreed 15% commission (${request.commissionAmount} CAD) from any compensation received</li>
            <li>Transferring the remaining compensation (${request.compensationAmount - request.commissionAmount} CAD) to my designated account</li>
          </ul>
          
          <h3>Commission Agreement</h3>
          <p>I understand and agree that:</p>
          <ul>
            <li>FlightClaim Pro will charge a 15% commission on successful claims only</li>
            <li>No fees are charged if the claim is unsuccessful</li>
            <li>The commission will be automatically deducted from any compensation received</li>
            <li>I will receive ${((request.compensationAmount - request.commissionAmount) / request.compensationAmount * 100).toFixed(1)}% of the total compensation</li>
          </ul>
          
          <p>This Power of Attorney shall remain in effect until the claim is resolved or I revoke it in writing.</p>
        </div>
        
        <div class="signature-area">
          <p><strong>Passenger Signature:</strong> ___________________________ <strong>Date:</strong> _______________</p>
          <p>${request.passengerName}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const docusignService = new DocuSignService();
