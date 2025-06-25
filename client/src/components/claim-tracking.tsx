import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Claim } from "@shared/schema";

export function ClaimTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data: claims, isLoading, error } = useQuery<Claim[]>({
    queryKey: ["/api/claims", searchTerm],
    enabled: shouldSearch && !!searchTerm,
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShouldSearch(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      case 'under-review':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'paid':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'claim-status-submitted';
      case 'under-review':
        return 'claim-status-under-review';
      case 'approved':
        return 'claim-status-approved';
      case 'rejected':
        return 'claim-status-rejected';
      case 'paid':
        return 'claim-status-paid';
      default:
        return 'claim-status-submitted';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section id="track" className="py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            <Search className="inline-block w-4 h-4 mr-2" />
            Track Your Claim
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor your claim progress and commission status in real-time
          </p>
        </div>

        <div className="win98-panel mb-6">
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1">
              Enter your Claim ID or Email
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="e.g., CLM-2024-001234 or your@email.com"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 win98-inset text-xs"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isLoading}
                  className="btn-primary"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-center py-4">
                <p className="text-destructive text-xs">
                  Error searching for claims. Please try again.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-xs">Searching for your claims...</p>
              </div>
            )}

            {claims && claims.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-xs">
                  No claims found for "{searchTerm}". Please check your Claim ID or email address.
                </p>
              </div>
            )}
          </div>

        {claims && claims.length > 0 && (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="win98-panel">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">
                    Claim #{claim.claimId}
                  </h3>
                  <div className="win98-inset px-2 py-1">
                    <div className="flex items-center">
                      {getStatusIcon(claim.status)}
                      <span className="ml-1 text-xs font-bold">{formatStatus(claim.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-bold">Flight:</p>
                      <p className="text-foreground">
                        {claim.flightNumber} - {claim.flightDate}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">Route:</p>
                      <p className="text-foreground">
                        {claim.departureAirport} → {claim.arrivalAirport}
                      </p>
                    </div>
                    {claim.compensationAmount && (
                      <div>
                        <p className="font-bold">Estimated Compensation:</p>
                        <p className="font-bold text-secondary">
                          ${parseFloat(claim.compensationAmount).toFixed(0)}
                        </p>
                      </div>
                    )}
                    {claim.commissionAmount && (
                      <div>
                        <p className="font-bold">Commission (15%):</p>
                        <p className="font-bold text-accent">
                          ${parseFloat(claim.commissionAmount).toFixed(0)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress Timeline */}
                  <div className="win98-inset mt-3">
                    <h4 className="font-bold mb-2">Claim Progress</h4>
                    <div className="space-y-2">
                      {claim.statusHistory?.map((status, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 flex-shrink-0 ${
                            index === 0 ? 'bg-secondary' : 'bg-muted-foreground'
                          }`} style={{border: '1px outset'}}></div>
                          <div className="flex-1">
                            <p className="font-bold">
                              {formatStatus(status.status)}
                            </p>
                            <p className="text-muted-foreground">
                              {formatDate(status.timestamp)}
                              {status.notes && ` - ${status.notes}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {claim.eligibilityValidation && (
                    <div className="win98-inset mt-3">
                      <h4 className="font-bold mb-2 text-xs">
                        Eligibility Assessment
                      </h4>
                      <div className={`p-2 ${
                        claim.eligibilityValidation.isEligible 
                          ? 'text-secondary'
                          : 'text-destructive'
                      }`}>
                        <p className="text-xs">
                          <strong>
                            {claim.eligibilityValidation.isEligible ? 'Eligible' : 'Not Eligible'}
                          </strong>
                          {' '}(Confidence: {Math.round(claim.eligibilityValidation.confidence * 100)}%)
                        </p>
                        <p className="text-xs mt-1">{claim.eligibilityValidation.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
