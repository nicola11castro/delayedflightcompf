import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Mail, CheckCircle, XCircle, DollarSign, Users, FileText, MessageSquare, Plane } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface Claim {
  id: number;
  claimId: string;
  passengerName: string;
  flightNumber: string;
  flightDate: string;
  status: string;
  compensationAmount?: string | number | null;
  commissionAmount?: string | number | null;
  poaRequested: boolean | null;
  poaSigned: boolean | null;
  email: string;
  delayDuration?: string | null;
  documentsUrls?: string[] | null;
  airlineDeadlineAt?: string | null;
  ctaFiledAt?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
}

function isOverdue(claim: Claim): boolean {
  if (!claim.airlineDeadlineAt || claim.ctaFiledAt) return false;
  if (["approved", "rejected", "paid"].includes(claim.status)) return false;
  return new Date(claim.airlineDeadlineAt).getTime() < Date.now();
}

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  emailMarketingConsent?: boolean | null;
  createdAt: string;
}

interface FlightGroup {
  flightKey: string;
  flightNumber: string;
  flightDate: string;
  count: number;
  statuses: Record<string, number>;
  needsReview: number;
  totalCompensation: number;
  flightData: { delayMinutes?: number | null; status?: string; airlineName?: string } | null;
  flightCase: { cause?: string | null; causeStatus?: string | null } | null;
  claims: { id: number; claimId: string; passengerName: string; status: string; delayReason?: string | null }[];
}

interface Payment {
  id: number;
  claimId: string;
  passengerName: string;
  email: string;
  compensationAmount: number;
  commissionAmount: number;
  status: string;
  paymentMethod?: string;
}

function AdminDashboardContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser, isSeniorAdmin } = useAuth();

  // Fetch claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery<Claim[]>({
    queryKey: ["/api/admin/claims"],
    retry: false,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: isSeniorAdmin,
  });

  // Claims grouped by flight
  const { data: flights = [], isLoading: flightsLoading } = useQuery<FlightGroup[]>({
    queryKey: ["/api/admin/flights"],
    retry: false,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    retry: false,
  });

  // Update claim status mutation
  const updateClaimMutation = useMutation({
    mutationFn: async ({ claimId, status, notes }: { claimId: number; status: string; notes?: string }) => {
      return await apiRequest("PATCH", `/api/admin/claims/${claimId}/status`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      toast({
        title: "Success",
        description: "Claim status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update claim status",
        variant: "destructive",
      });
    },
  });

  // Send email to airline mutation
  const emailAirlineMutation = useMutation({
    mutationFn: async (claimId: number) => {
      const response = await apiRequest("POST", `/api/admin/claims/${claimId}/email-airline`);
      return response.json() as Promise<{ message: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      toast({
        title: "Claim letter sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not send claim letter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send marketing email mutation
  const sendMarketingEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const response = await apiRequest("POST", "/api/admin/marketing/send", { subject, message });
      return response.json() as Promise<{ message: string }>;
    },
    onSuccess: (data) => {
      setEmailSubject("");
      setEmailMessage("");
      toast({
        title: "Campaign sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not send campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send commission invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async (claimId: number) => {
      const response = await apiRequest("POST", `/api/admin/claims/${claimId}/invoice`);
      return response.json() as Promise<{ message: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      toast({ title: "Invoice sent", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Could not send invoice", description: error.message, variant: "destructive" });
    },
  });

  // Change a user's role (senior admin only)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return response.json() as Promise<User>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update role", description: error.message, variant: "destructive" });
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
        <span>DelayedFlightComp - Admin Dashboard</span>
        <div className="flex gap-3 items-center text-xs">
          <span>{currentUser?.email} ({currentUser?.role})</span>
          <Link href="/" className="underline">Site</Link>
          <a href="/api/logout" className="underline">Logout</a>
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

        <Tabs defaultValue={window.location.hash === "#flights" ? "flights" : "claims"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 win98-border">
            <TabsTrigger value="claims" className="win98-button">
              <FileText className="w-4 h-4 mr-2" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="flights" className="win98-button">
              <Plane className="w-4 h-4 mr-2" />
              By flight
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
                          <td className="font-mono">
                            <Link href={`/admin/claims/${claim.id}`} className="underline">{claim.claimId}</Link>
                            {isOverdue(claim) && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                          </td>
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
                                title="Email claim letter to the airline"
                                onClick={() => emailAirlineMutation.mutate(claim.id)}
                                disabled={emailAirlineMutation.isPending}
                              >
                                <Mail className="w-3 h-3" />
                              </Button>
                              {(claim.documentsUrls ?? []).map((url, index) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs underline self-center">
                                  Doc {index + 1}
                                </a>
                              ))}
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

          {/* By flight */}
          <TabsContent value="flights" className="space-y-4">
            <div className="win98-dialog p-4">
              <h2 className="text-lg font-bold mb-1">Claims by flight</h2>
              <p className="text-xs text-muted-foreground mb-4">One investigation per disrupted flight, reused for every passenger on it. Open any claim to record the cause.</p>
              {flightsLoading ? (
                <p className="text-sm">Loading...</p>
              ) : flights.length === 0 ? (
                <p className="text-sm">No claims yet</p>
              ) : (
                <div className="space-y-3">
                  {flights.map((flight) => (
                    <div key={flight.flightKey} className="win98-border p-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <strong>{flight.flightNumber}</strong> · {flight.flightDate} · {flight.flightData?.airlineName ?? ""}{" "}
                          <Badge variant="outline">{flight.count} claim{flight.count > 1 ? "s" : ""}</Badge>
                          {flight.needsReview > 0 && <Badge variant="secondary" className="ml-1">{flight.needsReview} need review</Badge>}
                        </div>
                        <div className="text-xs">
                          {Object.entries(flight.statuses).map(([status, n]) => <span key={status} className="mr-2">{status}: {n}</span>)}
                          · ${flight.totalCompensation.toFixed(0)} at stake
                        </div>
                      </div>
                      <div className="text-xs mt-1">
                        {flight.flightData?.delayMinutes != null && <span className="mr-3">Provider delay: {Math.round(flight.flightData.delayMinutes / 6) / 10}h ({flight.flightData.status})</span>}
                        Investigation: <Badge variant={flight.flightCase?.causeStatus === "admissible" ? "default" : flight.flightCase?.causeStatus === "contested" ? "destructive" : "outline"}>{flight.flightCase?.causeStatus ?? "not started"}</Badge>
                        {flight.flightCase?.cause && <span className="ml-2">{flight.flightCase.cause}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {flight.claims.map((c) => (
                          <Link key={c.id} href={`/admin/claims/${c.id}`} className="underline text-xs">
                            {c.passengerName} ({c.status})
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                            <Badge variant={user.emailMarketingConsent ? "default" : "outline"}>
                              {user.emailMarketingConsent ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td>
                            {claims.filter((claim: Claim) => claim.email === user.email).length}
                          </td>
                          <td>
                            <select
                              className="win98-input text-xs"
                              value={user.role ?? "user"}
                              disabled={updateRoleMutation.isPending || user.id === currentUser?.id}
                              onChange={(e) => updateRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                            >
                              <option value="user">user</option>
                              <option value="junior_admin">junior_admin</option>
                              <option value="senior_admin">senior_admin</option>
                            </select>
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
                      <th>Passenger</th>
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
                          <td>{payment.passengerName}</td>
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
                              <Button
                                size="sm"
                                variant="outline"
                                className="win98-button"
                                onClick={() => sendInvoiceMutation.mutate(payment.id)}
                                disabled={sendInvoiceMutation.isPending || payment.status === "paid"}
                              >
                                Send Invoice
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="win98-button"
                                onClick={() => updateClaimMutation.mutate({ claimId: payment.id, status: "paid" })}
                                disabled={updateClaimMutation.isPending || payment.status === "paid"}
                              >
                                {payment.status === "paid" ? "Paid" : "Confirm Payment"}
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

/** Gate: only junior/senior admins see the dashboard; everyone else gets a clear next step. */
export default function AdminDashboard() {
  const { isLoading, isAuthenticated, isAdmin, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="win98-panel p-6 text-sm">Checking your session...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="win98-panel p-6 max-w-md space-y-3 text-sm">
          <h1 className="font-bold">Admin access required</h1>
          {isAuthenticated ? (
            <p>
              You are signed in as <strong>{user?.email}</strong>, which does not have admin rights. Ask a senior
              admin to change your role, or visit <Link href="/admin/setup" className="underline">admin setup</Link>.
            </p>
          ) : (
            <p>
              Please <Link href="/login" className="underline">sign in</Link> with an admin account to open the
              dashboard.
            </p>
          )}
          <Link href="/" className="underline text-xs">Back to site</Link>
        </div>
      </div>
    );
  }

  return <AdminDashboardContent />;
}
