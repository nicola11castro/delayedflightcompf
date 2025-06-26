import { CheckCircle, XCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { delayReasons } from "@/data/airlines";
import { Link } from "wouter";

export function ApprGuide() {
  const admissibleReasons = delayReasons.filter(reason => reason.valid);
  const nonAdmissibleReasons = delayReasons.filter(reason => !reason.valid);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="win98-panel mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              Canadian APPR Compensation Guide
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Understanding which flight delays qualify for compensation under Canada's Air Passenger Protection Regulations (APPR).
          </p>
        </div>

        {/* Overview */}
        <Card className="win98-panel mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              The Air Passenger Protection Regulations (APPR) require airlines to compensate passengers 
              for delays caused by issues within the airline's control that are not related to safety.
            </p>
            
            <div className="win98-inset p-4 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-bold text-sm mb-2">Compensation Amounts:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <strong>Large Airlines (Air Canada, WestJet):</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• 3-6 hours: $400 CAD</li>
                    <li>• 6-9 hours: $700 CAD</li>
                    <li>• 9+ hours: $1,000 CAD</li>
                  </ul>
                </div>
                <div>
                  <strong>Small Airlines (&lt;2M passengers/year):</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• 3-6 hours: $125 CAD</li>
                    <li>• 6-9 hours: $250 CAD</li>
                    <li>• 9+ hours: $500 CAD</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admissible Delay Reasons */}
        <Card className="win98-panel mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Admissible Delay Reasons
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These delays are within airline control, not safety-related, and eligible for compensation.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {admissibleReasons.map((reason) => (
                <div key={reason.value} className="win98-inset p-3 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-green-800 dark:text-green-200">
                        {reason.label}
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {getReasonDescription(reason.value)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Non-Admissible Delay Reasons */}
        <Card className="win98-panel mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Non-Admissible Delay Reasons
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These are extraordinary circumstances outside airline control or safety-related issues.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {nonAdmissibleReasons.map((reason) => (
                <div key={reason.value} className="win98-inset p-3 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-red-800 dark:text-red-200">
                        {reason.label}
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {getReasonDescription(reason.value)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="win98-panel">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Additional Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="btn-secondary w-full justify-start"
                onClick={() => window.open('https://otc-cta.gc.ca/eng/air-passenger-protection-regulations', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Official APPR Regulations (CTA)
              </Button>
              
              <Button
                variant="outline"
                className="btn-secondary w-full justify-start"
                onClick={() => window.open('https://www.cbc.ca/news/business/air-passenger-rights-compensation-1.5123456', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                CBC Guide to Air Passenger Rights
              </Button>
            </div>

            <div className="win98-inset p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-bold text-sm mb-2 text-yellow-800 dark:text-yellow-200">
                Important Notes:
              </h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Airlines must notify passengers of delays ≤14 days before departure for compensation eligibility</li>
                <li>• International flights may be covered under Montreal Convention instead of APPR</li>
                <li>• Keep all receipts and documentation related to your flight disruption</li>
                <li>• Contact your airline first before filing a claim with us</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getReasonDescription(value: string): string {
  const descriptions: Record<string, string> = {
    maintenance_non_safety: "Routine maintenance issues that don't affect flight safety, such as cabin equipment repairs or cosmetic fixes.",
    crew_scheduling: "Problems with crew scheduling, including missed connections, insufficient rest time, or staffing shortages.",
    overbooking: "Flight oversold by airline or passenger denied boarding due to seating capacity issues.",
    operational_decisions: "Airline business decisions like route changes, aircraft swaps, or schedule adjustments.",
    it_failure: "Computer system failures, booking system crashes, or technical issues with airline operations.",
    ground_handling: "Delays in baggage loading, refueling, or other ground operations not related to weather.",
    fueling_deicing: "Delays in aircraft fueling or de-icing when not caused by weather conditions.",
    weather: "Severe weather conditions that make flying unsafe, including storms, fog, or high winds.",
    atc: "Air traffic control restrictions, airport congestion, or airspace closures imposed by authorities.",
    security: "Security incidents, bomb threats, or enhanced security screening procedures.",
    airport_failure: "Issues with airport infrastructure, power outages, or equipment failures at the airport.",
    safety_maintenance: "Mandatory safety-related maintenance discovered during pre-flight checks or inspections.",
    third_party_strikes: "Strikes by air traffic controllers, airport workers, or other third-party service providers.",
    government_delays: "Government-imposed restrictions, border control issues, or regulatory delays.",
    medical_emergencies: "Medical emergencies requiring flight diversion or passenger removal for health reasons.",
    cyberattacks: "Cybersecurity incidents affecting airline operations or airport systems."
  };
  
  return descriptions[value] || "Delay reason as defined by APPR regulations.";
}