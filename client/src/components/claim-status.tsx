import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface ClaimStatus {
  id: number;
  claimId: string;
  passengerName: string;
  status: string;
  compensationAmount?: number;
  commissionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export function ClaimStatus() {
  const [claimId, setClaimId] = useState("");
  const [searchClaimId, setSearchClaimId] = useState("");

  const { data: claimStatus, isLoading, error } = useQuery({
    queryKey: ['/api/claims/status', searchClaimId],
    queryFn: async () => {
      if (!searchClaimId) return null;
      const response = await apiRequest('GET', `/api/claims/status/${searchClaimId}`);
      return response.json();
    },
    enabled: !!searchClaimId,
  });

  const handleSearch = () => {
    if (claimId.trim()) {
      setSearchClaimId(claimId.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'under-review':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'under-review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'paid':
        return 'Paid';
      default:
        return status;
    }
  };

  return (
    <section id="claim-status" className="py-12 bg-muted">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            <Search className="inline-block w-4 h-4 mr-2" />
            Check Claim Status
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your Claim ID to track your compensation progress
          </p>
        </div>

        <div className="win98-panel">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter Claim ID (e.g., YUL-abc123-def456)"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="win98-inset text-xs"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={!claimId.trim() || isLoading}
                className="btn-primary text-xs"
              >
                <Search className="w-3 h-3 mr-1" />
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {error && (
              <div className="p-3 win98-inset bg-destructive/10">
                <p className="text-xs text-destructive">
                  Claim not found. Please check your Claim ID and try again.
                </p>
              </div>
            )}

            {claimStatus && (
              <div className="space-y-4">
                <div className="win98-panel">
                  <h3 className="text-sm font-bold mb-3">Claim Details</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Claim ID:</span>
                      <span className="font-mono">{claimStatus.claimId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passenger:</span>
                      <span>{claimStatus.passengerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(claimStatus.status)}
                        <span className="font-bold">{getStatusText(claimStatus.status)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span>{new Date(claimStatus.createdAt).toLocaleDateString()}</span>
                    </div>
                    {claimStatus.compensationAmount && (
                      <>
                        <div className="flex justify-between">
                          <span>Compensation:</span>
                          <span className="font-bold">${claimStatus.compensationAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Our Commission (15%):</span>
                          <span className="font-bold text-accent">${claimStatus.commissionAmount}</span>
                        </div>
                        <div className="flex justify-between p-2 win98-inset">
                          <span className="font-bold">You Receive:</span>
                          <span className="font-bold text-secondary">
                            ${(claimStatus.compensationAmount - (claimStatus.commissionAmount || 0)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="win98-panel">
                  <h4 className="text-xs font-bold mb-2">Next Steps</h4>
                  <div className="text-xs text-muted-foreground">
                    {claimStatus.status === 'submitted' && (
                      <p>Your claim has been submitted and is being reviewed by our team.</p>
                    )}
                    {claimStatus.status === 'under-review' && (
                      <p>Your claim is currently under review. We'll update you soon.</p>
                    )}
                    {claimStatus.status === 'approved' && (
                      <p>Congratulations! Your claim has been approved. Payment is being processed.</p>
                    )}
                    {claimStatus.status === 'rejected' && (
                      <p>Unfortunately, your claim was not eligible for compensation under APPR regulations.</p>
                    )}
                    {claimStatus.status === 'paid' && (
                      <p>Your compensation has been paid! Thank you for using our service.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}