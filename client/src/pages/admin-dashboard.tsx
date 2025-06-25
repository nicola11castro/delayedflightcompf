import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Mail, CheckCircle, XCircle, DollarSign, Users, FileText, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface Claim {
  id: number;
  claimId: string;
  passengerName: string;
  flightNumber: string;
  flightDate: string;
  status: string;
  compensationAmount?: number;
  commissionAmount?: number;
  poaRequested: boolean;
  poaSigned: boolean;
  email: string;
  delayDuration?: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

interface Payment {
  id: number;
  claimId: string;
  compensationAmount: number;
  commissionAmount: number;
  status: string;
  paymentMethod?: string;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/admin/claims"],
    retry: false,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
    retry: false,
  });

  // Update claim status mutation
  const updateClaimMutation = useMutation({
    mutationFn: async ({ claimId, status, notes }: { claimId: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/admin/claims/${claimId}/status`, {
        method: "PATCH",
        body: { status, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      toast({
        title: "Success",
        description: "Claim status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive",
      });
    },
  });

  // Send email to airline mutation
  const emailAirlineMutation = useMutation({
    mutationFn: async (claimId: number) => {
      return await apiRequest(`/api/admin/claims/${claimId}/email-airline`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent to airline successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email to airline",
        variant: "destructive",
      });
    },
  });

  // Send marketing email mutation
  const sendMarketingEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      return await apiRequest("/api/admin/marketing/send", {
        method: "POST",
        body: { subject, message },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing"] });
      setEmailSubject("");
      setEmailMessage("");
      toast({
        title: "Success",
        description: "Marketing email sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send marketing email",
        variant: "destructive",
      });
    },
  });

  // Filter and sort data
  const filteredClaims = claims.filter((claim: Claim) =>
    claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.flightNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedClaims = [...filteredClaims].sort((a: Claim, b: Claim) => {
    const aValue = a[sortField as keyof Claim] || "";
    const bValue = b[sortField as keyof Claim] || "";
    const direction = sortDirection === "asc" ? 1 : -1;
    return aValue > bValue ? direction : -direction;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      submitted: "outline",
      "under-review": "secondary",
      approved: "default",
      rejected: "destructive",
      paid: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Windows 98 Style Title Bar */}
      <div className="win98-title-bar flex justify-between items-center">
        <span>FlightClaim Pro - Admin Dashboard</span>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs">_</button>
          <button className="px-2 py-1 text-xs">□</button>
          <button className="px-2 py-1 text-xs">×</button>
        </div>
      </div>

      <div className="p-4 win98-border min-h-[calc(100vh-32px)]">
        {/* Search Bar */}
        <div className="mb-6 win98-border p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search by Claim ID, Passenger Name, or Flight Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="win98-input blinking-cursor flex-1"
            />
          </div>
        </div>

        <Tabs defaultValue="claims" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 win98-border">
            <TabsTrigger value="claims" className="win98-button">
              <FileText className="w-4 h-4 mr-2" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="users" className="win98-button">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="win98-button">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="marketing" className="win98-button">
              <MessageSquare className="w-4 h-4 mr-2" />
              Email Marketing
            </TabsTrigger>
          </TabsList>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-4">
            <div className="win98-dialog p-4">
              <h2 className="text-lg font-bold mb-4">Claims Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full win98-table">
                  <thead>
                    <tr>
                      <th 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("claimId")}
                      >
                        Claim ID {sortField === "claimId" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("passengerName")}
                      >
                        Passenger Name
                      </th>
                      <th>Flight Number</th>
                      <th>Date</th>
                      <th>Delay Duration</th>
                      <th>Status</th>
                      <th>Compensation</th>
                      <th>Commission ($105 on $700)</th>
                      <th>POA Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4">Loading...</td>
                      </tr>
                    ) : sortedClaims.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4">No claims found</td>
                      </tr>
                    ) : (
                      sortedClaims.map((claim: Claim) => (
                        <tr key={claim.id}>
                          <td className="font-mono">{claim.claimId}</td>
                          <td>{claim.passengerName}</td>
                          <td>{claim.flightNumber}</td>
                          <td>{new Date(claim.flightDate).toLocaleDateString()}</td>
                          <td>{claim.delayDuration || "N/A"}</td>
                          <td>{getStatusBadge(claim.status)}</td>
                          <td>${claim.compensationAmount || 0}</td>
                          <td>${claim.commissionAmount || 0}</td>
                          <td>
                            {claim.poaRequested ? (
                              claim.poaSigned ? (
                                <Badge variant="default">Signed</Badge>
                              ) : (
                                <Badge variant="outline">Requested</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Not Required</Badge>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="win98-button"
                                onClick={() => updateClaimMutation.mutate({
                                  claimId: claim.id,
                                  status: "approved"
                                })}
                                disabled={updateClaimMutation.isPending}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="win98-button"
                                onClick={() => updateClaimMutation.mutate({
                                  claimId: claim.id,
                                  status: "rejected"
                                })}
                                disabled={updateClaimMutation.isPending}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="win98-button"
                                onClick={() => emailAirlineMutation.mutate(claim.id)}
                                disabled={emailAirlineMutation.isPending}
                              >
                                <Mail className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="win98-dialog p-4">
              <h2 className="text-lg font-bold mb-4">Users Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full win98-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registration Date</th>
                      <th>Email Marketing Consent</th>
                      <th>Claims Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">Loading...</td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">No users found</td>
                      </tr>
                    ) : (
                      users.map((user: User) => (
                        <tr key={user.id}>
                          <td className="font-mono">{user.id}</td>
                          <td>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A"}</td>
                          <td>{user.email}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Badge variant="default">Yes</Badge>
                          </td>
                          <td>
                            {claims.filter((claim: Claim) => claim.email === user.email).length}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="win98-button">
                                Edit User
                              </Button>
                              <Button size="sm" variant="destructive" className="win98-button">
                                Delete User
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="win98-dialog p-4">
              <h2 className="text-lg font-bold mb-4">Payments Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full win98-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Passenger ID</th>
                      <th>Compensation</th>
                      <th>Commission ($105)</th>
                      <th>Invoice Status</th>
                      <th>Payment Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">Loading...</td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">No payments found</td>
                      </tr>
                    ) : (
                      payments.map((payment: Payment) => (
                        <tr key={payment.id}>
                          <td className="font-mono">{payment.claimId}</td>
                          <td>USER-{payment.id}</td>
                          <td>${payment.compensationAmount}</td>
                          <td>${payment.commissionAmount}</td>
                          <td>
                            <Badge variant={payment.status === "paid" ? "default" : "outline"}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td>{payment.paymentMethod || "POA"}</td>
                          <td>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="win98-button">
                                Send Invoice
                              </Button>
                              <Button size="sm" variant="default" className="win98-button">
                                Confirm Payment
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Email Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            <div className="win98-dialog p-4">
              <h2 className="text-lg font-bold mb-4">Email Marketing</h2>
              <div className="grid gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Subject</label>
                    <Input
                      placeholder="e.g., New YUL delay? Claim with 15% fee!"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="win98-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      className="w-full p-2 win98-input min-h-[100px]"
                      placeholder="Enter your marketing message here..."
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => sendMarketingEmailMutation.mutate({
                      subject: emailSubject,
                      message: emailMessage
                    })}
                    disabled={sendMarketingEmailMutation.isPending || !emailSubject || !emailMessage}
                    className="win98-button"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Campaign
                  </Button>
                </div>

                <div className="mt-8">
                  <h3 className="text-md font-bold mb-4">Sent Campaigns</h3>
                  <table className="w-full win98-table">
                    <thead>
                      <tr>
                        <th>Campaign ID</th>
                        <th>Date</th>
                        <th>Recipients</th>
                        <th>Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center py-4" colSpan={4}>No campaigns sent yet</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}