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
    <section id="track" className="py-20 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-inter font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-4">
            Track Your Claim
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Monitor your claim progress and commission status in real-time
          </p>
        </div>

        <Card className="shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your Claim ID or Email
              </label>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  placeholder="e.g., CLM-2024-001234 or your@email.com"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
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
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">
                  Error searching for claims. Please try again.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Searching for your claims...</p>
              </div>
            )}

            {claims && claims.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No claims found for "{searchTerm}". Please check your Claim ID or email address.
                </p>
              </div>
            )}

            {claims && claims.length > 0 && (
              <div className="space-y-6">
                {claims.map((claim) => (
                  <Card key={claim.id} className="border border-gray-200 dark:border-gray-600">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Claim #{claim.claimId}
                        </CardTitle>
                        <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          <span className="ml-1">{formatStatus(claim.status)}</span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Flight</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {claim.flightNumber} - {claim.flightDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Route</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {claim.departureAirport} → {claim.arrivalAirport}
                          </p>
                        </div>
                        {claim.compensationAmount && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Compensation</p>
                            <p className="font-semibold text-secondary text-lg">
                              ${parseFloat(claim.compensationAmount).toFixed(0)}
                            </p>
                          </div>
                        )}
                        {claim.commissionAmount && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Commission (15%)</p>
                            <p className="font-semibold text-accent text-lg">
                              ${parseFloat(claim.commissionAmount).toFixed(0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Progress Timeline */}
                      <div className="border-t pt-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Claim Progress</h4>
                        <div className="space-y-4">
                          {claim.statusHistory?.map((status, index) => (
                            <div key={index} className="flex items-center space-x-4">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                index === 0 ? 'bg-secondary' : 'bg-gray-300 dark:bg-gray-600'
                              }`}></div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatStatus(status.status)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(status.timestamp)}
                                  {status.notes && ` - ${status.notes}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {claim.eligibilityValidation && (
                        <div className="border-t pt-6 mt-6">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Eligibility Assessment
                          </h4>
                          <div className={`p-3 rounded-lg ${
                            claim.eligibilityValidation.isEligible 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          }`}>
                            <p className="text-sm">
                              <strong>
                                {claim.eligibilityValidation.isEligible ? 'Eligible' : 'Not Eligible'}
                              </strong>
                              {' '}(Confidence: {Math.round(claim.eligibilityValidation.confidence * 100)}%)
                            </p>
                            <p className="text-sm mt-1">{claim.eligibilityValidation.reason}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
