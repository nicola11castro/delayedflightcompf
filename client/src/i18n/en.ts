import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";

/** English strings. Keys are the contract; fr.ts must define every key. */
export const en = {
  // Navigation
  "nav.submit": "Submit Claim",
  "nav.track": "Track Status",
  "nav.calculator": "Calculator",
  "nav.faq": "FAQ",
  "nav.register": "Register",
  "nav.login": "Login",
  "nav.logout": "Logout",
  "nav.myClaims": "My Claims",
  "nav.admin": "Admin",
  "nav.language": "FR",
  "nav.languageTitle": "Passer en français",
  "nav.theme": "Toggle theme",

  // Hero
  "hero.title": "Get Your Flight Compensation",
  "hero.subtitle": "15% Fee, No Win No Pay",
  "hero.lead": "Delayed, cancelled, or denied boarding on a flight to, from or within Canada? Claim up to $2,400 CAD. We only charge our 15% commission when you win.",
  "hero.commissionTitle": "Transparent Commission Structure",
  "hero.compensation": "Compensation",
  "hero.ourFee": "Our Fee (15%)",
  "hero.youReceive": "You Receive",
  "hero.ifNoWin": "If No Win",
  "hero.noFee": "$0 Fee",
  "hero.submit": "Submit Claim",
  "hero.calculate": "Calculate",
  "hero.welcome": "Welcome back, {name}!",
  "hero.newUser": "New User? Register here",
  "hero.haveAccount": "Have an account? Login",
  "hero.quickTitle": "Quick Claim Process",
  "hero.quickLead": "Submit your claim in under 5 minutes. We check your eligibility against the APPR rules instantly.",
  "hero.quick1": "Flight details & documents",
  "hero.quick2": "Instant APPR eligibility check",
  "hero.quick3": "Commission only on success",

  // Trust indicators
  "trust.maxAmount": "Up to $2,400",
  "trust.maxLabel": "APPR compensation per passenger",
  "trust.commission": "15%",
  "trust.commissionLabel": "Our commission, only if you win",
  "trust.noWin": "$0",
  "trust.noWinLabel": "If the claim is unsuccessful",

  // Calculator
  "calc.title": "Commission Calculator",
  "calc.lead": "See exactly what you'll receive after our 15% commission. Amounts follow Canada's APPR: they depend on what happened, the airline's size and how late you arrived.",
  "calc.heading": "Calculate Your Compensation",
  "calc.issue": "What happened? *",
  "calc.issuePlaceholder": "Select what happened",
  "calc.airline": "Airline *",
  "calc.airlinePlaceholder": "Select your airline",
  "calc.largeGroup": "Large airlines ($400 – $1,000)",
  "calc.smallGroup": "Small airlines ($125 – $500)",
  "calc.otherLarge": "Other large airline",
  "calc.otherSmall": "Other small airline",
  "calc.delay": "Delay at arrival *",
  "calc.delayPlaceholder": "Select delay duration",
  "calc.reason": "Reason given by the airline *",
  "calc.reasonPlaceholder": "Select delay reason",
  "calc.vouchers": "Meal vouchers received",
  "calc.vouchersPlaceholder": "e.g., $15 or leave blank",
  "calc.vouchersHelp": "If you received meal vouchers, specify the amount in CAD. Otherwise leave blank.",
  "calc.button": "Calculate Compensation",
  "calc.calculating": "Calculating...",
  "calc.resultTitle": "Your Compensation Breakdown",
  "calc.appr": "APPR compensation ({carrier})",
  "calc.deniedBoarding": "Denied boarding compensation",
  "calc.voucherDeduct": "Meal vouchers already received",
  "calc.total": "Total Compensation",
  "calc.commission": "Our Commission (15%)",
  "calc.youReceive": "You Receive",
  "calc.reviewNote": "We will confirm the cause of the disruption with the airline before anything is paid.",
  "calc.submitNow": "Submit Your Claim Now",
  "calc.stillSubmit": "Not sure the airline was right? You can still submit and our team will verify the real cause.",
  "calc.carrierLarge": "large carrier",
  "calc.carrierSmall": "small carrier",

  // Issue types, delay bands, reasons
  "issue.delayed": "Flight Delayed",
  "issue.cancelled": "Flight Cancelled",
  "issue.denied-boarding": "Denied Boarding (overbooked)",
  "issue.missed-connection": "Missed Connection",
  "band.0-3": "Less than 3 hours",
  "band.3-6": "3–6 hours",
  "band.6-9": "6–9 hours",
  "band.9+": "9+ hours",
  "reason.maintenance_non_safety": "Maintenance Issues (Non-Safety)",
  "reason.crew_scheduling": "Crew Scheduling Problems",
  "reason.overbooking": "Overbooking or Boarding Issues",
  "reason.operational_decisions": "Operational Decisions",
  "reason.it_failure": "IT System Failures",
  "reason.ground_handling": "Ground Handling Delays",
  "reason.fueling_deicing": "Fueling or De-Icing Delays (Non-Weather)",
  "reason.weather": "Weather Conditions",
  "reason.atc": "Air Traffic Control (ATC) Restrictions",
  "reason.security": "Security Incidents",
  "reason.airport_failure": "Airport Operational Issues",
  "reason.safety_maintenance": "Safety-Related Maintenance",
  "reason.third_party_strikes": "Third-Party Strikes",
  "reason.government_delays": "Government or Regulatory Delays",
  "reason.medical_emergencies": "Medical Emergencies",
  "reason.cyberattacks": "Cyberattacks",
  "reason.unknown": "I don't know / the airline didn't say",
  "reasonDesc.maintenance_non_safety": "Routine maintenance issues that don't affect flight safety, such as cabin equipment repairs or cosmetic fixes.",
  "reasonDesc.crew_scheduling": "Problems with crew scheduling, including missed connections, insufficient rest time, or staffing shortages.",
  "reasonDesc.overbooking": "Flight oversold by the airline or passenger denied boarding due to seating capacity issues.",
  "reasonDesc.operational_decisions": "Airline business decisions like route changes, aircraft swaps, or schedule adjustments.",
  "reasonDesc.it_failure": "Computer system failures, booking system crashes, or technical issues with airline operations.",
  "reasonDesc.ground_handling": "Delays in baggage loading, refueling, or other ground operations not related to weather.",
  "reasonDesc.fueling_deicing": "Delays in aircraft fueling or de-icing when not caused by weather conditions.",
  "reasonDesc.weather": "Severe weather conditions that make flying unsafe, including storms, fog, or high winds.",
  "reasonDesc.atc": "Air traffic control restrictions, airport congestion, or airspace closures imposed by authorities.",
  "reasonDesc.security": "Security incidents, bomb threats, or enhanced security screening procedures.",
  "reasonDesc.airport_failure": "Issues with airport infrastructure, power outages, or equipment failures at the airport.",
  "reasonDesc.safety_maintenance": "Mandatory safety-related maintenance discovered during pre-flight checks or inspections.",
  "reasonDesc.third_party_strikes": "Strikes by air traffic controllers, airport workers, or other third-party service providers.",
  "reasonDesc.government_delays": "Government-imposed restrictions, border control issues, or regulatory delays.",
  "reasonDesc.medical_emergencies": "Medical emergencies requiring flight diversion or passenger removal for health reasons.",
  "reasonDesc.cyberattacks": "Cybersecurity incidents affecting airline operations or airport systems.",
  "reasonDesc.unknown": "Airlines must tell you the reason. If they didn't, we request it from them and verify it.",

  // Claim form
  "claim.title": "Submit Your Compensation Claim",
  "claim.lead": "Simple 3-step process. We check your eligibility against the APPR rules and handle everything for just 15%.",
  "claim.received": "Claim received",
  "claim.saveId": "Save your Claim ID. You need it to track progress, and we quote it in every email we send you.",
  "claim.estimate": "Estimated APPR compensation: {amount} CAD (our 15% is only charged if you win).",
  "claim.reviewPending": "The cause of your disruption will be verified with the airline before we confirm the amount.",
  "claim.track": "Track this claim",
  "claim.another": "Submit another claim",
  "claim.step": "Step {n} of 3",
  "claim.step1": "Flight Details",
  "claim.step2": "Supporting Documents",
  "claim.step3": "Agreement & Submission",
  "claim.flightNumber": "Flight Number *",
  "claim.flightNumberPlaceholder": "e.g., AC 123",
  "claim.flightDate": "Flight Date *",
  "claim.departure": "Departure Airport *",
  "claim.departurePlaceholder": "e.g., Montreal (YUL)",
  "claim.arrival": "Arrival Airport *",
  "claim.arrivalPlaceholder": "e.g., Vancouver (YVR)",
  "claim.passengerInfo": "Passenger Information",
  "claim.fullName": "Full Name *",
  "claim.fullNamePlaceholder": "As shown on boarding pass",
  "claim.email": "Email Address *",
  "claim.emailPlaceholder": "your@email.com",
  "claim.prefilled": "Filled from your account. Change it if the passenger is someone else.",
  "claim.details": "What went wrong",
  "claim.whatHappened": "What happened? *",
  "claim.selectIssue": "Select issue type",
  "claim.delayDuration": "How late did you arrive? *",
  "claim.selectDelay": "Select delay duration",
  "claim.delayReason": "Reason given by the airline *",
  "claim.selectReason": "Select delay reason",
  "claim.reasonHelp": "Not sure? Pick \"I don't know\". We will get the reason from the airline.",
  "claim.vouchers": "Meal Vouchers Received",
  "claim.vouchersPlaceholder": "e.g., $15 or leave blank",
  "claim.vouchersHelp": "If you received meal vouchers, specify the amount in CAD. Otherwise leave blank.",
  "claim.docs": "Supporting Documents",
  "claim.uploadLead": "Upload your boarding pass and any relevant documents",
  "claim.uploadHelp": "PDF, PNG, or JPG files up to 10MB each, maximum 5 files",
  "claim.chooseFiles": "Choose Files",
  "claim.uploadedFiles": "Uploaded Files",
  "claim.remove": "Remove",
  "claim.consentsTitle": "Required Consents & Commission Agreement",
  "claim.feeTitle": "Our transparent fee structure:",
  "claim.fee1": "15% commission only charged on successful claims",
  "claim.fee2": "No upfront fees or hidden costs",
  "claim.fee3": "Full support throughout the process",
  "claim.fee4": "Expert negotiation with airlines",
  "claim.commissionAgree": "I agree to the 15% commission fee structure *",
  "claim.commissionAgreeHelp": "This fee covers our service and is deducted from your compensation before transfer.",
  "claim.previous": "Previous",
  "claim.next": "Next",
  "claim.submit": "Submit Claim for Review",
  "claim.submitting": "Submitting...",
  "claim.successToast": "Claim Submitted Successfully",
  "claim.successDesc": "Your Claim ID is {id}. Keep it to track your claim.",
  "claim.failToast": "Submission Failed",
  "claim.failDesc": "There was an error submitting your claim. Please try again.",
  "claim.invalidFiles": "Invalid Files",
  "claim.invalidFilesDesc": "Some files were rejected. Only PDF, PNG, and JPG files up to 10MB are allowed.",
  "claim.commissionRequired": "You must agree to the commission structure to submit a claim",
  "claim.consentRequired": "You must accept all Terms of Service and agreements to submit a claim",

  // Claim status / tracking
  "status.sectionTitle": "Track Your Claim",
  "status.sectionLead": "Track your claim progress using your unique Claim ID. Get real-time updates on your compensation request.",
  "status.heading": "Check Claim Status",
  "status.help": "Enter your Claim ID to track your compensation progress",
  "status.placeholder": "Enter Claim ID (e.g., YUL-abc123-def456)",
  "status.search": "Search",
  "status.searching": "Searching...",
  "status.notFound": "Claim not found. Please check your Claim ID and try again.",
  "status.details": "Claim Details",
  "status.claimId": "Claim ID:",
  "status.passenger": "Passenger:",
  "status.status": "Status:",
  "status.submittedOn": "Submitted:",
  "status.compensation": "Compensation:",
  "status.commission": "Our Commission (15%):",
  "status.youReceive": "You Receive:",
  "status.nextSteps": "Next Steps",
  "status.label.submitted": "Submitted",
  "status.label.under-review": "Under Review",
  "status.label.approved": "Approved",
  "status.label.rejected": "Rejected",
  "status.label.paid": "Paid",
  "status.msg.submitted": "Your claim has been submitted and is being reviewed by our team.",
  "status.msg.under-review": "Your claim is currently under review with the airline. We'll update you soon.",
  "status.msg.approved": "Congratulations! Your claim has been approved. Payment is being processed.",
  "status.msg.rejected": "Unfortunately, your claim was not eligible for compensation under APPR regulations.",
  "status.msg.paid": "Your compensation has been paid! Thank you for using our service.",

  // FAQ
  "faq.title": "Frequently Asked Questions",
  "faq.lead": "Common questions about our 15% commission and the claim process",
  "faq.placeholder": "Search FAQs or ask a question...",
  "faq.listening": "🎤 Listening... Click mic to stop",
  "faq.assistant": "Assistant Response",
  "faq.close": "Close",
  "faq.loading": "Loading FAQs...",
  "faq.noResults": "No FAQs found for \"{q}\". Try asking our FAQ Assistant!",
  "faq.processing": "Processing...",
  "faq.askButton": "FAQ Assistant",
  "faq.stillTitle": "Still have questions about our commission?",
  "faq.stillLead": "Our FAQ Assistant can answer specific questions about fees, processing times, and commission calculations.",
  "faq.unavailable": "Assistant Unavailable",
  "faq.unavailableDesc": "Please try again later or contact our support team.",
  "faq.voiceUnsupported": "Voice Search Not Supported",
  "faq.voiceUnsupportedDesc": "Please use a modern browser with voice recognition support.",
  "faq.voiceError": "Voice Recognition Error",
  "faq.voiceErrorDesc": "Please try again or type your question.",
  "faq.voiceFailed": "Voice Search Failed",
  "faq.voiceFailedDesc": "Please try typing your question instead.",
  "faq.q1": "How does the 15% commission work?",
  "faq.a1": "We only charge our 15% commission if your claim is successful. If you receive $700 in compensation, we deduct $105 (15%) and transfer $595 to you. If your claim is unsuccessful, you pay nothing.",
  "faq.q2": "What's the difference between POA and regular claims?",
  "faq.a2": "With a Power of Attorney (POA), we collect compensation directly from the airline, deduct our 15% commission, and transfer the rest to you. Without POA, the airline pays you directly, and we invoice you for the 15% commission afterward.",
  "faq.q3": "Are there any hidden fees besides the 15%?",
  "faq.a3": "No hidden fees. Our 15% commission is the only charge, and it's only collected if your claim succeeds. There are no upfront costs, processing fees, or additional charges.",
  "faq.q4": "How long does a claim take?",
  "faq.a4": "Airlines have 30 days to respond under the APPR. If they refuse, we can escalate to the Canadian Transportation Agency, which can take several months. We keep you updated at each step.",

  // Footer
  "footer.tagline": "Get the compensation you deserve for flight delays and cancellations. Transparent 15% commission, no win no fee guarantee.",
  "footer.promise": "Our Commission Promise",
  "footer.p1": "Only 15% when you win",
  "footer.p2": "No upfront costs",
  "footer.p3": "Transparent pricing",
  "footer.p4": "Direct deduction with POA",
  "footer.services": "Services",
  "footer.submit": "Submit Claim",
  "footer.track": "Track Status",
  "footer.calculator": "Commission Calculator",
  "footer.guide": "APPR Rights Guide",
  "footer.support": "Support",
  "footer.faq": "FAQ",
  "footer.contact": "Contact Us",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.rights": `© {year} ${BRAND_NAME}. All rights reserved. PIPEDA and Law 25 compliant.`,

  // Auth
  "auth.loginTitle": `Sign in to ${BRAND_NAME}`,
  "auth.loginLead": "Track your claims and manage your account",
  "auth.email": "Email Address",
  "auth.password": "Password",
  "auth.signIn": "Sign In",
  "auth.signingIn": "Signing in...",
  "auth.newHere": "New here?",
  "auth.createAccount": "Create an account",
  "auth.backHome": "Back to home",
  "auth.forgot": "Forgot your password?",
  "auth.welcomeBack": "Welcome back",
  "auth.signedInAs": "Signed in as {email}",
  "auth.loginFailed": "Login failed",
  "auth.registerTitle": `Register for ${BRAND_NAME}`,
  "auth.registerLead": "Create your account to submit and track flight compensation claims",
  "auth.personal": "Personal Information",
  "auth.firstName": "First Name *",
  "auth.lastName": "Last Name *",
  "auth.emailRequired": "Email Address *",
  "auth.passwordRequired": "Password *",
  "auth.confirmPassword": "Confirm Password *",
  "auth.minChars": "At least 8 characters.",
  "auth.create": "Create Account",
  "auth.creating": "Creating Account...",
  "auth.haveAccount": "Already have an account?",
  "auth.signInHere": "Sign in here",
  "auth.explore": "Want to explore first?",
  "auth.goHome": "Go back to home",
  "auth.registered": "Registration Successful",
  "auth.registeredDesc": "Your account has been created and you are now signed in. Check your inbox to verify your email.",
  "auth.registerFailed": "Registration Failed",
  "auth.passwordsMismatch": "Passwords do not match",
  "auth.confirmRequired": "Please confirm your password",
  "auth.forgotTitle": "Reset your password",
  "auth.forgotLead": "Enter your email and we will send you a link to choose a new password.",
  "auth.sendLink": "Send reset link",
  "auth.sending": "Sending...",
  "auth.forgotSent": "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.",
  "auth.resetTitle": "Choose a new password",
  "auth.resetLead": "Enter a new password for your account.",
  "auth.newPassword": "New Password",
  "auth.resetButton": "Update password",
  "auth.resetting": "Updating...",
  "auth.resetDone": "Your password has been updated and you are signed in.",
  "auth.resetFailed": "Could not reset password",
  "auth.resetInvalid": "This reset link is invalid or has expired. Request a new one.",

  // Consents
  "consent.required": "Required Consents",
  "consent.allAgree": `I have read and agree to all of ${BRAND_NAME}'s Terms of Service and agreements. *`,
  "consent.terms": "Terms of Service",
  "consent.privacy": "Privacy Policy",
  "consent.retention": "Data Retention Policy",
  "consent.marketing": "Email Marketing",
  "consent.marketingPrefix": "I consent to",
  "consent.optional": "(Optional)",
  "consent.preAgreed": "✓ You have already agreed to our Terms of Service, Privacy Policy, and Data Retention Policy during registration.",
  "consent.claimTitle": "Claim-Specific Consents",
  "consent.poa": "Power of Attorney Agreement",
  "consent.poaRequired": "Required to proceed with your claim processing",
  "consent.marketingHelp": "Updates about your claim and service improvements",
  "consent.close": "Close",
  "consent.docTitle.terms": "Terms of Service",
  "consent.docTitle.privacy": "Privacy Policy",
  "consent.docTitle.dataRetention": "Data Retention Policy",
  "consent.docTitle.poa": "Power of Attorney Agreement",
  "consent.docTitle.emailMarketing": "Email Marketing Consent",
  "consent.doc.terms": `Terms of Service
${BRAND_NAME}

This agreement governs your use of the ${BRAND_NAME} service.

1.1 Service Description
We assist in processing flight disruption claims under Canada's Air Passenger Protection Regulations (APPR) for flights to, from, or within Canada.

1.2 Commission
A 15% commission (e.g., $105 on a $700 claim) is charged only on successful claims. You receive the remaining 85% (e.g., $595).

1.3 User Obligations
You must provide accurate information, including flight number, date, delay duration, the reason given by the airline, and boarding pass. Misrepresentation may result in claim rejection.

1.4 Limitations
Compensation is not guaranteed and depends on airline liability under APPR. We are not responsible for airline rejections or delays.

1.5 Dispute Resolution
Contact us at ${SUPPORT_EMAIL}. We respond within 48 hours, per Quebec's Consumer Protection Act.

1.6 Acceptance
By checking the box, you agree to these terms.`,
  "consent.doc.privacy": `Privacy Policy
${BRAND_NAME}

This policy outlines how we handle your personal information, per Canada's PIPEDA and Quebec's Law 25.

1.1 Data Collected
We collect: name, email, flight number, flight date, delay duration, delay reason, and boarding pass.

1.2 Usage
Data is used for claim processing, airline submissions, and email updates (marketing only with consent).

1.3 Storage
Data is stored in our encrypted database and retained for 1 year, per APPR, even if you delete your account.

1.4 Sharing
Data is shared with airlines and regulators for claims. No other third-party sharing occurs.

1.5 User Rights
You may access, correct, or delete your data (except claims, per APPR). Contact ${SUPPORT_EMAIL}.

1.6 Acceptance
By checking the box, you agree to this policy.`,
  "consent.doc.dataRetention": `Data Retention Consent
${BRAND_NAME}

This consent addresses data retention for APPR compliance.

1.1 Retention
Claim data (flight details, boarding pass) is retained for 1 year, per APPR, even if you delete your account.

1.2 User Rights
You may delete personal data (name, email), but claim data remains for regulatory purposes. Contact ${SUPPORT_EMAIL}.

1.3 Compliance
This complies with PIPEDA and Quebec's Law 25.

1.4 Acceptance
By checking the box, you acknowledge claim data retention.`,
  "consent.doc.poa": `Power of Attorney Agreement
${BRAND_NAME}

This agreement authorizes our service to act on your behalf for APPR claims.

1.1 Scope
We are authorized to submit claims, negotiate, and collect compensation for your specified flight disruption.

1.2 Commission
We deduct a 15% commission (e.g., $105 on $700) and forward the remaining 85% (e.g., $595) to you.

1.3 Consent
You provide this authority electronically. You may revoke it with 7 days notice to ${SUPPORT_EMAIL}.

1.4 Compliance
This agreement complies with Quebec's Civil Code and Consumer Protection Act.

1.5 Acceptance
By checking the box, you grant this power of attorney.`,
  "consent.doc.emailMarketing": `Email Marketing Consent
${BRAND_NAME}

This consent allows us to send you promotional emails.

1.1 Scope
You agree to receive emails about passenger rights, service updates, and offers.

1.2 Opt-Out
Unsubscribe at any time via the link in our emails or by contacting ${SUPPORT_EMAIL}.

1.3 Compliance
This complies with Canada's Anti-Spam Legislation (CASL) and PIPEDA.

1.4 Acceptance
By checking the box, you consent to receive marketing emails.`,

  // My claims
  "my.title": "My Claims",
  "my.lead": "Every claim linked to your account, with its current status.",
  "my.none": "You have not submitted a claim yet.",
  "my.newClaim": "Submit a claim",
  "my.verifyBanner": "Your email address is not verified yet. Verify it so we can reach you about your claims.",
  "my.resend": "Resend verification email",
  "my.resent": "Verification email sent. Check your inbox.",
  "my.verifiedToast": "Email verified. Thank you!",
  "my.flight": "Flight",
  "my.submittedOn": "Submitted",
  "my.estimate": "Estimated compensation",
  "my.pendingReview": "Pending verification",
  "my.history": "History",
  "my.documents": "{n} document(s) uploaded",

  // APPR modal
  "appr.title": "APPR Eligibility Notice",
  "appr.msg.weather": "Weather conditions are considered extraordinary circumstances under APPR and are not eligible for compensation.",
  "appr.msg.atc": "Air Traffic Control restrictions are outside airline control and not eligible for compensation.",
  "appr.msg.security": "Security incidents are extraordinary circumstances not covered by APPR compensation.",
  "appr.msg.airport_failure": "Airport operational issues are outside airline control and not eligible for compensation.",
  "appr.msg.safety_maintenance": "Safety-related maintenance is required by law and not eligible for compensation under APPR.",
  "appr.msg.third_party_strikes": "Third-party strikes are extraordinary circumstances outside airline control.",
  "appr.msg.government_delays": "Government or regulatory delays are outside airline control and not compensable.",
  "appr.msg.medical_emergencies": "Medical emergencies are extraordinary circumstances not covered by APPR.",
  "appr.msg.cyberattacks": "Cyberattacks are extraordinary circumstances outside normal airline operations.",
  "appr.msg.default": "This delay reason is not eligible for compensation under Canadian APPR regulations.",
  "appr.alternatives": "Good to know:",
  "appr.alt1": "Airlines sometimes misstate the reason. We can ask them to justify it.",
  "appr.alt2": "International flights may qualify under the Montreal Convention instead.",
  "appr.alt3": "Check your travel insurance policy for coverage.",
  "appr.understand": "I Understand",
  "appr.learnMore": "Learn More About APPR",
  "appr.submitAnyway": "Submit anyway for verification",
  "appr.submitAnywayHelp": "No fee unless we win. Our team will check the airline's stated reason.",

  // APPR guide
  "guide.back": "Back to Home",
  "guide.title": "Canadian APPR Compensation Guide",
  "guide.lead": "Understanding which flight disruptions qualify for compensation under Canada's Air Passenger Protection Regulations (APPR).",
  "guide.overview": "Overview",
  "guide.overviewText": "The Air Passenger Protection Regulations (APPR) require airlines to compensate passengers for delays and cancellations caused by issues within the airline's control that are not related to safety, and for denied boarding.",
  "guide.amounts": "Compensation amounts (per passenger, by delay at arrival):",
  "guide.large": "Large airlines (Air Canada, WestJet, 2M+ passengers/year):",
  "guide.small": "Small airlines (under 2M passengers/year):",
  "guide.denied": "Denied boarding (any airline):",
  "guide.admissible": "Admissible Delay Reasons",
  "guide.admissibleLead": "These delays are within airline control, not safety-related, and eligible for compensation.",
  "guide.inadmissible": "Non-Admissible Delay Reasons",
  "guide.inadmissibleLead": "These are extraordinary circumstances outside airline control or safety-related issues.",
  "guide.resources": "Additional Resources",
  "guide.cta": "Official APPR Regulations (CTA)",
  "guide.notes": "Important Notes:",
  "guide.note1": "Airlines must notify passengers of delays or cancellations less than 14 days before departure for compensation to apply",
  "guide.note2": "Airlines have 30 days to respond to a claim; unresolved claims can be escalated to the Canadian Transportation Agency",
  "guide.note3": "International flights may also be covered under the Montreal Convention",
  "guide.note4": "Keep all receipts and documentation related to your flight disruption",

  // Assistant (Côney)
  "clippy.name": "Côney Assistant",
  "clippy.moreTips": "More Tips",
  "clippy.show": "Show Assistant",
  "clippy.clickHelp": "Click for help, eh!",
  "clippy.welcome": "Salut! I'm Côney, your Montreal construction cone assistant. I help navigate flight compensation like I navigate Montreal traffic - with style!",
  "clippy.claim-start": "Great! You're starting a claim. Pro tip: Have your boarding pass, flight confirmation, and any delay notifications ready for faster processing.",
  "clippy.documentation": "Document everything! Upload clear photos of your boarding pass, delay announcements, meal vouchers, and hotel receipts if provided by the airline.",
  "clippy.commission-info": "Our transparent 15% commission is only charged when we WIN your case. No success = No fee. You keep 85% of all compensation!",
  "clippy.poa-explanation": "The Power of Attorney is standard practice and allows us to negotiate directly with airlines. It's secure and can be revoked anytime!",
  "clippy.delay-tip": "Flight wisdom: in Canada, a 3+ hour delay within the airline's control pays $125 to $1,000, and denied boarding pays up to $2,400!",
  "clippy.tracking-help": "Lost your claim details? No worries! Use your Claim ID to track progress. We'll also send regular updates to your inbox.",
  "clippy.faq-tip": "Got questions? Check our FAQ or ask me directly - I know all the airline tricks!",
  "clippy.easter-egg": "Eh! You found me! I'm Côney the cone - Montreal's favorite traffic director, now helping with flight delays. Construction season never ends!",
  "clippy.delay-reason-valid": "Good news! This delay reason typically qualifies for compensation. Airlines are responsible for crew issues, maintenance, and operational problems.",
  "clippy.delay-reason-invalid": "Heads up! This delay reason is usually considered 'extraordinary circumstances' - airlines typically aren't required to pay compensation for weather, ATC, or security issues.",
  "clippy.airline-large": "You're dealing with a large airline! They pay the higher APPR amounts ($400-$1,000) but may have more complex claim processes.",
  "clippy.airline-small": "This is a smaller airline with lower APPR amounts ($125-$500), but they often have simpler claim processes and faster response times.",

  // Unsubscribe page
  "unsub.title": "You're unsubscribed",
  "unsub.text": "You will no longer receive marketing emails from us. Claim updates are not affected.",
  "unsub.invalid": "This unsubscribe link is invalid. Contact us at " + SUPPORT_EMAIL + " and we will remove you manually.",

  // Common
  "common.loading": "Loading...",
  "common.cad": "CAD",
} as const;

export type TranslationKey = keyof typeof en;
