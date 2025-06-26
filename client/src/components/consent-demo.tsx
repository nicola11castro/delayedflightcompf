import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ConsentFile {
  type: string;
  filename: string;
  timestamp: string;
  agreed: boolean;
}

export function ConsentDemo() {
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    dataRetention: false,
    poa: false,
    emailMarketing: false
  });
  
  const [generatedFiles, setGeneratedFiles] = useState<ConsentFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const consentLabels = {
    terms: "Terms of Service Agreement",
    privacy: "Privacy Policy Consent",
    dataRetention: "Data Retention Agreement",
    poa: "Power of Attorney Authorization",
    emailMarketing: "Email Marketing Consent"
  };

  const handleConsentChange = (type: string, checked: boolean) => {
    setConsents(prev => ({ ...prev, [type]: checked }));
  };

  const generateConsentFiles = async () => {
    setIsGenerating(true);
    const mockUserData = {
      email: "demo.user@example.com",
      firstName: "Demo",
      lastName: "User",
      claimId: "YUL-DEMO-123456"
    };

    const newFiles: ConsentFile[] = [];

    try {
      for (const [type, agreed] of Object.entries(consents)) {
        if (agreed) {
          // Record consent and generate file
          const response = await fetch('/api/consent/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consentType: type,
              userEmail: mockUserData.email,
              userName: `${mockUserData.firstName} ${mockUserData.lastName}`,
              claimId: type === 'poa' || type === 'emailMarketing' ? mockUserData.claimId : undefined,
              documentVersion: '1.0',
              agreed: true
            })
          });

          if (response.ok) {
            const result = await response.json();
            newFiles.push({
              type,
              filename: result.filename,
              timestamp: new Date().toISOString(),
              agreed: true
            });
          }
        }
      }

      setGeneratedFiles(newFiles);
    } catch (error) {
      console.error('Error generating consent files:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilenamePreview = (type: string) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_').replace('T', '_');
    return `${type}_Demo_User_demo.user@example.com_${type === 'poa' || type === 'emailMarketing' ? 'YUL-DEMO-123456' : 'NO_CLAIM'}_${timestamp}.json`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="win98-panel">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Systematic Consent File Generation Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each checkbox creates a uniquely named file with complete audit trail and metadata.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm">Select Consent Agreements:</h3>
            {Object.entries(consentLabels).map(([type, label]) => (
              <div key={type} className="flex items-start space-x-3">
                <Checkbox
                  checked={consents[type as keyof typeof consents]}
                  onCheckedChange={(checked) => handleConsentChange(type, checked as boolean)}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium">{label}</label>
                  <div className="text-xs text-muted-foreground font-mono">
                    Will create: {getFilenamePreview(type)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Files Button */}
          <Button
            onClick={generateConsentFiles}
            disabled={isGenerating || Object.values(consents).every(c => !c)}
            className="btn-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Files...' : 'Generate Consent Files'}
          </Button>

          {/* Generated Files Display */}
          {generatedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">Generated Consent Files:</h3>
              <div className="win98-inset p-4 bg-green-50 dark:bg-green-900/20">
                {generatedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{consentLabels[file.type as keyof typeof consentLabels]}</div>
                      <div className="text-xs font-mono text-muted-foreground">{file.filename}</div>
                      <div className="text-xs text-green-600">✓ Consent recorded at {new Date(file.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Naming Convention Explanation */}
          <div className="win98-inset p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-bold text-sm mb-2">File Naming Convention:</h4>
            <div className="text-xs space-y-2">
              <div><strong>Format:</strong> ConsentType_FirstName_LastName_Email_ClaimID_Timestamp.json</div>
              <div><strong>Example:</strong> poa_John_Doe_john.doe@email.com_YUL-ABC123-XYZ789_2025-01-15_14-30-45.json</div>
              <div><strong>Benefits:</strong></div>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Unique identification for each consent instance</li>
                <li>Easy sorting and filtering by type, user, or date</li>
                <li>Complete audit trail with metadata</li>
                <li>GDPR/PIPEDA compliance ready</li>
                <li>Searchable by email or claim ID</li>
              </ul>
            </div>
          </div>

          {/* File Content Structure */}
          <div className="win98-inset p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="font-bold text-sm mb-2">File Content Structure:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
{`{
  "consentType": "poa",
  "userEmail": "john.doe@email.com",
  "userName": "John Doe",
  "claimId": "YUL-ABC123-XYZ789",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "documentVersion": "1.0",
  "agreed": true,
  "filename": "poa_John_Doe_john.doe@email.com_YUL-ABC123-XYZ789_2025-01-15_14-30-45.json",
  "recordedAt": "2025-01-15T14:30:45.456Z",
  "documentPath": "./consent-documents/poa_v1.0.md"
}`}
            </pre>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}