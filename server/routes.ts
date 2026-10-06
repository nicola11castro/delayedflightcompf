import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { createHash, randomBytes, randomUUID } from "crypto";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertClaimSchema, CLAIM_STATUSES, USER_ROLES, type Claim } from "@shared/schema";
import { estimateCompensation, getReasonStatus, isDelayBand, bandsForIssue, ISSUE_TYPES, type CompensationEstimate } from "@shared/appr";
import { verifyEmailSignature, verifyClaimToken, signPoaUrl } from "./config";
import { sendStageEmail } from "./services/claim-emails";
import { renderPoaPdf, storePoaPdf, poaFileName, POA_VERSION } from "./services/poa";
import { createCommissionCheckout, isStripeConfigured, verifyStripeSignature } from "./services/stripe";
import { lookupFlight, isFlightLookupConfigured, offlineFlightHint, normalizeFlightNumber } from "./services/flight-data";
import { extractBoardingPass, isBoardingPassAiConfigured } from "./services/boarding-pass";
import { isAiConfigured } from "./services/openai";
import { validateClaimEligibility, handleChatbotQuery, generateCommissionExplanation } from "./services/openai";
import { airtableService } from "./services/airtable";
import { docusignService } from "./services/docusign";
import { emailService } from "./services/email";
import { googleSheetsService } from "./services/google-sheets";
import { consentManager } from "./services/consent-manager";
import {
  setupAuth,
  isAuthenticated,
  isJuniorAdmin,
  isSeniorAdmin,
  isConfiguredAdmin,
  adminEmails,
  toPublicUser,
} from "./auth";

// ---------------------------------------------------------------------------
// File uploads (boarding passes, receipts). Stored on local disk; see README
// for the note about ephemeral disks on some hosts.
// ---------------------------------------------------------------------------
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || "uploads");
const MAX_FILES = 5;
const ALLOWED_UPLOADS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(UPLOADS_DIR, { recursive: true }, (err) => cb(err, UPLOADS_DIR));
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_UPLOADS[file.mimetype] ?? ""}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOADS[file.mimetype]) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF, PNG, and JPG files are allowed."));
  },
});

const uploadDocuments: RequestHandler = (req, res, next) => {
  upload.array("documents", MAX_FILES)(req, res, (err: unknown) => {
    if (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "File upload failed" });
    }
    next();
  });
};

async function removeFiles(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Multipart forms send every value as text; turn "true"/"false" back into booleans.
const formBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "on" || value === "1",
  z.boolean(),
);

const claimSubmissionSchema = insertClaimSchema
  .omit({ documentsUrls: true, boardingPassUrl: true, poaDocumentUrl: true, status: true, flightData: true })
  .extend({
    passengerName: z.string().trim().min(1, "Passenger name is required"),
    email: z.string().trim().toLowerCase().email("A valid email address is required"),
    flightNumber: z.string().trim().min(2, "Flight number is required"),
    flightDate: z.string().trim().min(1, "Flight date is required"),
    departureAirport: z.string().trim().min(1, "Departure airport is required"),
    arrivalAirport: z.string().trim().min(1, "Arrival airport is required"),
    issueType: z.enum(["delayed", "cancelled", "denied-boarding", "missed-connection"]),
    delayDuration: z.string().refine(isDelayBand, { message: "Delay duration must be one of the listed ranges" }),
    delayReason: z.string().min(1, "Delay reason is required"),
    language: z.enum(["en", "fr"]).optional(),
    mealVouchers: z.string().trim().max(100).optional(),
    poaConsent: formBoolean.refine((value) => value === true, {
      message: "Power of Attorney consent is required to proceed with claim",
    }),
    poaRequested: formBoolean.optional(),
    emailMarketingConsentClaim: formBoolean.optional(),
    allClaimConsentsAccepted: formBoolean.optional(),
  })
  .refine((data) => bandsForIssue(data.issueType).some((band) => band.value === data.delayDuration), {
    message: "Delays under 3 hours are only compensable for denied boarding",
    path: ["delayDuration"],
  });

const calculatorSchema = z.object({
  issueType: z.enum(ISSUE_TYPES as [string, ...string[]]).optional(),
  carrierSize: z.enum(["large", "small"]).optional(),
  airline: z.string().trim().max(100).optional(),
  delayDuration: z.string(),
  delayReason: z.string().min(1, "Delay reason is required"),
  mealVouchers: z.string().max(100).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(CLAIM_STATUSES),
  notes: z.string().trim().max(2000).optional(),
});

const consentRecordInputSchema = z.object({
  consentType: z.enum(["terms", "privacy", "dataRetention", "poa", "emailMarketing"]),
  userEmail: z.string().trim().toLowerCase().email(),
  userName: z.string().trim().min(1).max(200),
  claimId: z.string().trim().max(50).optional(),
  documentVersion: z.string().trim().max(20).default("1.0"),
  agreed: z.boolean().default(true),
});

/** YUL-{8 chars from email+time}-{6 random} — the one ID used in the DB, consents, emails and tracking. */
function generateClaimId(email: string): string {
  const hash = createHash("sha256")
    .update(`${email}:${Date.now()}`)
    .digest("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 8);
  return `YUL-${hash}-${randomBytes(3).toString("hex")}`;
}

const STATUS_MESSAGES: Record<(typeof CLAIM_STATUSES)[number], string> = {
  submitted: "Your claim has been submitted and is in our queue.",
  "under-review": "Our team is reviewing your claim and corresponding with the airline.",
  approved: "Your claim has been approved. We are now arranging payment.",
  rejected: "Unfortunately the airline has declined this claim and it is not eligible under the APPR.",
  paid: "Your compensation has been paid. Thank you for using FlightClaim Pro.",
};

/** Non-blocking follow-ups after a claim is saved: flight data, AI second opinion, Airtable mirror, confirmation email. */
async function runClaimFollowUps(claim: Claim, estimate: CompensationEstimate) {
  if (isFlightLookupConfigured()) {
    try {
      const flight = await lookupFlight(claim.flightNumber, claim.flightDate);
      if (flight) {
        const matchesReported = flight.delayBand === null ? null : flight.delayBand === claim.delayDuration;
        await storage.updateClaim(claim.id, {
          flightData: {
            provider: flight.provider,
            airlineName: flight.airlineName,
            airlineIata: flight.airlineIata,
            departureIata: flight.departureIata,
            departureAirport: flight.departureAirport,
            arrivalIata: flight.arrivalIata,
            arrivalAirport: flight.arrivalAirport,
            scheduledArrival: flight.scheduledArrival,
            actualArrival: flight.actualArrival,
            delayMinutes: flight.delayMinutes,
            status: flight.status,
            delayBand: flight.delayBand,
            matchesReported,
            fetchedAt: flight.fetchedAt,
          },
        });
        const delayText = flight.delayMinutes === null ? "delay unknown" : `${Math.round(flight.delayMinutes / 60 * 10) / 10}h late at arrival`;
        await storage.addClaimEvent({
          claimId: claim.id,
          type: "system",
          message: `Flight data (${flight.provider}): ${flight.airlineName ?? "?"} ${flight.flightIata} ${flight.departureIata ?? "?"}→${flight.arrivalIata ?? "?"}, status ${flight.status ?? "?"}, ${delayText}. ${matchesReported === false ? `Reported ${claim.delayDuration}h does NOT match provider band ${flight.delayBand ?? "<3h"}.` : matchesReported ? "Matches the reported delay." : ""}`,
          metadata: { matchesReported, providerBand: flight.delayBand, reported: claim.delayDuration },
        });
      } else {
        await storage.addClaimEvent({ claimId: claim.id, type: "system", message: `Flight data: no record found for ${claim.flightNumber} on ${claim.flightDate}; verify manually.` });
      }
    } catch (error) {
      console.error("Flight data enrichment failed:", error);
    }
  }

  try {
    const ai = await validateClaimEligibility({
      flightNumber: claim.flightNumber,
      flightDate: claim.flightDate,
      departureAirport: claim.departureAirport,
      arrivalAirport: claim.arrivalAirport,
      issueType: claim.issueType,
      delayDuration: claim.delayDuration || undefined,
      delayReason: claim.delayReason || undefined,
    });
    if (ai) {
      await storage.updateClaimEligibility(claim.id, {
        isEligible: estimate.eligible,
        confidence: ai.confidence,
        reason: `${estimate.reason} AI pre-screen (${Math.round(ai.confidence * 100)}% confident): ${ai.reason}`,
        source: "ai",
      });
    }
  } catch (error) {
    console.error("Eligibility pre-screen failed:", error);
  }

  if (airtableService.isConfigured()) {
    try {
      await airtableService.createClaimRecord(claim);
    } catch (error) {
      console.error("Airtable sync failed:", error);
    }
  }

  await sendStageEmail(claim, "submitted");
}

const AIRLINE_RESPONSE_DAYS = 30;

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** Admin view of a claim with its event log and computed deadline state. */
async function claimDetail(claim: Claim) {
  const events = await storage.getClaimEvents(claim.id);
  const now = new Date();
  const deadline = claim.airlineDeadlineAt ? new Date(claim.airlineDeadlineAt) : null;
  const open = !["approved", "rejected", "paid"].includes(claim.status);
  const daysLeft = deadline ? daysBetween(now, deadline) : null;
  return {
    ...claim,
    events,
    lifecycle: {
      airlineResponseDays: AIRLINE_RESPONSE_DAYS,
      daysLeft,
      overdue: open && deadline !== null && daysLeft !== null && daysLeft < 0 && !claim.ctaFiledAt,
      canEscalate: open && deadline !== null && !claim.ctaFiledAt,
    },
    poaSignUrl: claim.poaSigned ? null : signPoaUrl(claim.claimId),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Feature flags the client adapts to (never secrets).
  app.get("/api/config", (_req, res) => {
    res.json({
      flightLookup: isFlightLookupConfigured(),
      boardingPassAi: isBoardingPassAiConfigured(),
      assistant: isAiConfigured(),
      payments: isStripeConfigured(),
    });
  });

  // Flight lookup for the "check my flight" step. Falls back to what we know from the airline code.
  app.get("/api/flights/lookup", async (req, res) => {
    const parsed = z
      .object({ flightNumber: z.string().trim().min(3).max(10), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "A flight number (e.g. AC123) and a date are required" });
    }
    const flightIata = normalizeFlightNumber(parsed.data.flightNumber);
    if (!flightIata) {
      return res.status(400).json({ message: "Flight number should look like AC123" });
    }
    const hint = offlineFlightHint(flightIata);
    if (!isFlightLookupConfigured()) {
      return res.json({ configured: false, found: false, flightIata, ...hint });
    }
    const flight = await lookupFlight(flightIata, parsed.data.date);
    if (!flight) {
      return res.json({ configured: true, found: false, flightIata, ...hint });
    }
    res.json({ configured: true, found: true, ...hint, ...flight });
  });

  // Boarding-pass reading (AI vision). 503 tells the client to use on-device OCR instead.
  const boardingPassUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  app.post("/api/boarding-pass/extract", (req, res) => {
    boardingPassUpload.single("image")(req, res, async (err: unknown) => {
      if (err) return res.status(400).json({ message: "Could not read the uploaded image" });
      if (!isBoardingPassAiConfigured()) return res.status(503).json({ message: "Boarding-pass AI reading is not configured", code: "NOT_CONFIGURED" });
      const file = req.file;
      if (!file || !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype)) {
        return res.status(400).json({ message: "Upload a PNG, JPG or WEBP photo of the boarding pass" });
      }
      try {
        const fields = await extractBoardingPass(file.buffer, file.mimetype);
        res.json(fields ?? { confidence: 0, source: "ai" });
      } catch (error) {
        console.error("Boarding pass extraction failed:", error);
        res.status(502).json({ message: "Could not read the boarding pass; please fill the fields manually" });
      }
    });
  });

  // Sessions, /api/register, /api/login, /api/logout, /api/auth/user
  await setupAuth(app);

  // Write the consent documents (markdown) on start when the disk allows it
  await consentManager.generateConsentDocuments();

  // -------------------------------------------------------------------------
  // Admin bootstrap: a signed-in user whose email is listed in ADMIN_EMAILS
  // can grant themselves senior admin (normally done automatically on login).
  // -------------------------------------------------------------------------
  app.post("/api/setup-admin", isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!isConfiguredAdmin(user.email)) {
        return res.status(403).json({
          message: `${user.email} is not listed in ADMIN_EMAILS (${adminEmails().join(", ")}).`,
        });
      }
      const updated = await storage.updateUserRole(user.id, "senior_admin");
      res.json({ message: "Senior admin access granted", user: toPublicUser(updated) });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ message: "Admin setup failed" });
    }
  });

  // -------------------------------------------------------------------------
  // Claims
  // -------------------------------------------------------------------------
  app.post("/api/claims", uploadDocuments, async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    try {
      const parsed = claimSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        await removeFiles(files);
        return res.status(400).json({
          message: parsed.error.errors[0]?.message ?? "Invalid claim data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const data = parsed.data;

      // Inadmissible or unknown reasons are accepted and flagged for the team to verify with the airline.
      const reasonStatus = getReasonStatus(data.delayReason);

      const claimId = generateClaimId(data.email);
      const estimate = estimateCompensation({
        issueType: data.issueType,
        flightNumber: data.flightNumber,
        delayDuration: data.delayDuration,
        delayReason: data.delayReason,
        mealVouchers: data.mealVouchers,
      });

      const { language, ...claimFields } = data;
      const claim = await storage.createClaim(
        {
          ...claimFields,
          userId: req.user?.id ?? null,
          language: language ?? "en",
          poaRequested: data.poaRequested ?? false,
          emailMarketingConsentClaim: data.emailMarketingConsentClaim ?? false,
          allClaimConsentsAccepted: data.poaConsent,
          documentsUrls: files.map((file) => `/api/admin/uploads/${file.filename}`),
          compensationAmount: estimate.eligible ? estimate.compensationAmount.toFixed(2) : null,
          commissionAmount: estimate.eligible ? estimate.commissionAmount.toFixed(2) : null,
          eligibilityValidation: {
            isEligible: estimate.eligible,
            confidence: reasonStatus === "admissible" ? (estimate.carrierKnown ? 0.9 : 0.6) : 0.3,
            reason: estimate.reason,
            source: "rules",
            needsReview: estimate.needsReview,
          },
        },
        claimId,
      );

      await storage.addClaimEvent({
        claimId: claim.id,
        type: "system",
        message: `Claim submitted (${data.issueType}, ${data.delayDuration}h, reason: ${data.delayReason}). ${estimate.reason}`,
        actorEmail: req.user?.email ?? null,
        metadata: { estimate, needsReview: estimate.needsReview },
      });

      const consentBase = {
        userEmail: data.email,
        userName: data.passengerName,
        claimId,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        documentVersion: "1.0",
        agreed: true,
      };
      await consentManager.recordConsent({ ...consentBase, consentType: "poa" });
      if (data.emailMarketingConsentClaim) {
        await consentManager.recordConsent({ ...consentBase, consentType: "emailMarketing" });
      }

      res.status(201).json({ ...claim, estimate });

      void runClaimFollowUps(claim, estimate);
    } catch (error) {
      await removeFiles(files);
      console.error("Claim creation error:", error);
      res.status(500).json({ message: "Failed to create claim. Please try again." });
    }
  });

  // Public tracking by Claim ID (the ID itself is the secret).
  app.get("/api/claims/status/:claimId", async (req, res) => {
    try {
      const claim = await storage.getClaimByClaimId(req.params.claimId.trim());
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Get claim status error:", error);
      res.status(500).json({ message: "Failed to retrieve claim status" });
    }
  });

  // Lookup by Claim ID (public) or by email (own account or admin only).
  app.get("/api/claims/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier.trim();
      if (identifier.includes("@")) {
        if (!req.isAuthenticated() || !req.user) {
          return res.status(401).json({ message: "Please sign in to look up claims by email" });
        }
        const email = identifier.toLowerCase();
        const isAdmin = ["junior_admin", "senior_admin"].includes(req.user.role ?? "user");
        if (!isAdmin && req.user.email?.toLowerCase() !== email) {
          return res.status(403).json({ message: "You can only view claims for your own email address" });
        }
        return res.json(await storage.getClaimsByEmail(email));
      }
      const claim = await storage.getClaimByClaimId(identifier);
      res.json(claim ? [claim] : []);
    } catch (error) {
      console.error("Claim lookup error:", error);
      res.status(500).json({ message: "Failed to retrieve claims" });
    }
  });

  app.get("/api/my-claims", isAuthenticated, async (req, res) => {
    try {
      const mine = await storage.getClaimsForUser(req.user!.id, req.user!.email);
      res.json(mine.map((claim) => ({ ...claim, poaSignUrl: claim.poaSigned ? null : signPoaUrl(claim.claimId) })));
    } catch (error) {
      console.error("My claims error:", error);
      res.status(500).json({ message: "Failed to retrieve your claims" });
    }
  });

  // -------------------------------------------------------------------------
  // Commission calculator (APPR rules table, no account needed)
  // -------------------------------------------------------------------------
  app.post("/api/calculate-compensation", (req, res) => {
    const parsed = calculatorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid calculator input" });
    }
    const input = parsed.data;
    const estimate = estimateCompensation({
      issueType: input.issueType,
      carrierSize: input.carrierSize,
      airlineName: input.airline,
      delayDuration: input.delayDuration,
      delayReason: input.delayReason,
      mealVouchers: input.mealVouchers,
    });

    res.json({
      ...estimate,
      explanation: generateCommissionExplanation(estimate.compensationAmount, estimate.commissionAmount, estimate.finalAmount),
    });
  });

  // -------------------------------------------------------------------------
  // DocuSign Power of Attorney (optional integration)
  // -------------------------------------------------------------------------
  app.post("/api/docusign/create-poa", isAuthenticated, async (req, res) => {
    try {
      const { claimId } = z.object({ claimId: z.string().min(1) }).parse(req.body);
      const claim = await storage.getClaimByClaimId(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const isAdmin = ["junior_admin", "senior_admin"].includes(req.user?.role ?? "user");
      if (!isAdmin && req.user?.email?.toLowerCase() !== claim.email.toLowerCase()) {
        return res.status(403).json({ message: "You can only request a POA for your own claim" });
      }

      const signingResponse = await docusignService.createPOAEnvelope({
        claimId: claim.claimId,
        passengerName: claim.passengerName,
        passengerEmail: claim.email,
        compensationAmount: claim.compensationAmount ? Number(claim.compensationAmount) : 0,
        commissionAmount: claim.commissionAmount ? Number(claim.commissionAmount) : 0,
      });

      await storage.updateClaimPOA(claim.id, false);
      res.json(signingResponse);
    } catch (error) {
      console.error("DocuSign POA creation error:", error);
      res.status(500).json({ message: "Failed to create Power of Attorney document" });
    }
  });

  app.post("/api/docusign/callback", async (req, res) => {
    try {
      const { envelopeId, event } = req.body ?? {};
      if (event === "envelope-completed" && envelopeId) {
        const status = await docusignService.getEnvelopeStatus(envelopeId);
        return res.json({ success: true, completed: status.completed });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("DocuSign callback error:", error);
      res.status(500).json({ message: "Callback processing failed" });
    }
  });

  // -------------------------------------------------------------------------
  // Admin dashboard
  // -------------------------------------------------------------------------
  const updateClaimStatusHandler: RequestHandler = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "Invalid claim id" });
      }
      const parsed = statusUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: `Status must be one of: ${CLAIM_STATUSES.join(", ")}` });
      }
      const existing = await storage.getClaimById(id);
      if (!existing) {
        return res.status(404).json({ message: "Claim not found" });
      }

      const { status, notes } = parsed.data;
      const historyNote = notes || `Status changed from ${existing.status} to ${status} by ${req.user?.email ?? "admin"}`;
      let claim = await storage.updateClaimStatus(id, status, historyNote);
      if (status === "paid" && claim.paymentStatus !== "paid") {
        claim = await storage.updateClaim(id, { paymentStatus: "paid", paidAt: new Date() });
      }
      await storage.addClaimEvent({
        claimId: id,
        type: "status",
        message: `Status ${existing.status} → ${status}${notes ? `: ${notes}` : ""}`,
        actorEmail: req.user?.email ?? null,
        metadata: { from: existing.status, to: status },
      });

      if (status !== existing.status) {
        if (status === "approved" || status === "rejected" || status === "paid") {
          void sendStageEmail(claim, status, { actorEmail: req.user?.email });
        } else {
          emailService
            .sendStatusUpdate(claim.email, {
              claimId: claim.claimId,
              passengerName: claim.passengerName,
              newStatus: status,
              statusMessage: notes || STATUS_MESSAGES[status],
            })
            .catch((error) => console.error("Status update email failed:", error));
        }
      }

      res.json(claim);
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ message: "Failed to update claim status" });
    }
  };
  app.patch("/api/admin/claims/:id/status", isJuniorAdmin, updateClaimStatusHandler);
  app.patch("/api/claims/:id/status", isJuniorAdmin, updateClaimStatusHandler);

  app.get("/api/admin/claims", isJuniorAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllClaims());
    } catch (error) {
      console.error("Error fetching admin claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Payments view derived from approved/paid claims (no separate payments table yet).
  app.get("/api/admin/payments", isJuniorAdmin, async (_req, res) => {
    try {
      const claims = await storage.getAllClaims();
      const payments = claims
        .filter((claim) => claim.status === "approved" || claim.status === "paid")
        .map((claim) => ({
          id: claim.id,
          claimId: claim.claimId,
          passengerName: claim.passengerName,
          email: claim.email,
          compensationAmount: Number(claim.compensationAmount ?? 0),
          commissionAmount: Number(claim.commissionAmount ?? 0),
          status: claim.status,
          paymentMethod: claim.poaSigned ? "POA (direct deduction)" : "Invoice after payout",
        }));
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/uploads/:filename", isJuniorAdmin, (req, res) => {
    const filename = path.basename(req.params.filename);
    res.sendFile(path.join(UPLOADS_DIR, filename), (error) => {
      if (error && !res.headersSent) res.status(404).json({ message: "File not found" });
    });
  });

  // Record that the claim went to the airline (starts the 30-day clock) and email the letter when SMTP is set up.
  app.post("/api/admin/claims/:id/email-airline", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const to = process.env.AIRLINE_CLAIMS_EMAIL;
      let emailed = false;
      if (to && emailService.isConfigured()) {
        emailed = await emailService.sendAirlineClaimLetter(to, claim);
      }

      const nextStatus = claim.status === "submitted" ? "under-review" : claim.status;
      const contactedAt = new Date();
      const note = emailed
        ? `Claim letter emailed to ${to} by ${req.user?.email ?? "admin"}`
        : `Claim sent to the airline (recorded by ${req.user?.email ?? "admin"}; letter not emailed automatically)`;
      await storage.updateClaimStatus(claim.id, nextStatus, note);
      const updated = await storage.updateClaim(claim.id, {
        airlineContactedAt: claim.airlineContactedAt ?? contactedAt,
        airlineDeadlineAt: claim.airlineDeadlineAt ?? new Date(contactedAt.getTime() + AIRLINE_RESPONSE_DAYS * 24 * 60 * 60 * 1000),
      });
      await storage.addClaimEvent({
        claimId: claim.id,
        type: "letter",
        message: `${emailed ? `Claim letter emailed to the airline (${to}).` : "Claim recorded as sent to the airline (send the letter manually: " + (to ? "SMTP not configured" : "AIRLINE_CLAIMS_EMAIL not set") + ")."} Airline has ${AIRLINE_RESPONSE_DAYS} days to respond.`,
        actorEmail: req.user?.email ?? null,
        metadata: { to: to ?? null, emailed },
      });
      void sendStageEmail(updated, "sent_to_airline", { actorEmail: req.user?.email });
      res.json({
        message: emailed
          ? `Claim letter sent to ${to}; airline deadline set`
          : `Airline deadline recorded. ${to ? "Email is not configured, send the letter manually." : "Set AIRLINE_CLAIMS_EMAIL to email letters automatically."}`,
        emailed,
        claim: updated,
      });
    } catch (error) {
      console.error("Email airline error:", error);
      res.status(500).json({ message: "Failed to record the airline contact" });
    }
  });

  // Commission invoice: a Stripe Checkout link when configured, e-Transfer instructions otherwise.
  const sendInvoiceHandler: RequestHandler = async (req, res) => {
    try {
      const id = Number(req.params.id);
      let claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      if (!claim.compensationAmount || !claim.commissionAmount) {
        return res.status(400).json({ message: "This claim has no compensation amount yet" });
      }
      if (claim.paymentStatus === "paid") {
        return res.status(400).json({ message: "This commission is already paid" });
      }

      let paymentLink = claim.paymentLinkUrl ?? undefined;
      if (isStripeConfigured() && !paymentLink) {
        const session = await createCommissionCheckout(claim);
        paymentLink = session.url;
        claim = await storage.updateClaim(claim.id, { paymentLinkUrl: session.url, stripeSessionId: session.id, paymentStatus: "link_sent" });
      } else if (!paymentLink) {
        claim = await storage.updateClaim(claim.id, { paymentStatus: "link_sent" });
      }

      await storage.addClaimEvent({
        claimId: claim.id,
        type: "payment",
        message: paymentLink ? `Commission invoice sent with Stripe payment link` : `Commission invoice sent with e-Transfer instructions (Stripe not configured)`,
        actorEmail: req.user?.email ?? null,
        metadata: { paymentLink: paymentLink ?? null, commission: claim.commissionAmount },
      });
      const sent = await sendStageEmail(claim, "payment_link", { actorEmail: req.user?.email, paymentLink });
      res.json({
        message: sent ? `Invoice emailed to ${claim.email}` : `Invoice recorded; email not sent (SMTP not configured)`,
        paymentLink: paymentLink ?? null,
        claim,
      });
    } catch (error) {
      console.error("Invoice error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to send the invoice" });
    }
  };
  app.post("/api/admin/claims/:id/invoice", isJuniorAdmin, sendInvoiceHandler);
  app.post("/api/admin/claims/:id/payment-link", isJuniorAdmin, sendInvoiceHandler);

  // Claim detail with event log
  app.get("/api/admin/claims/:id", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.json(await claimDetail(claim));
    } catch (error) {
      console.error("Claim detail error:", error);
      res.status(500).json({ message: "Failed to load claim" });
    }
  });

  app.post("/api/admin/claims/:id/notes", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = z.object({ message: z.string().trim().min(1).max(5000) }).safeParse(req.body);
      if (!Number.isInteger(id) || !parsed.success) {
        return res.status(400).json({ message: "A note is required" });
      }
      const claim = await storage.getClaimById(id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const event = await storage.addClaimEvent({ claimId: id, type: "note", message: parsed.data.message, actorEmail: req.user?.email ?? null });
      res.status(201).json(event);
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // Airline missed its 30 days: record the CTA complaint and tell the passenger.
  app.post("/api/admin/claims/:id/escalate", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      if (claim.ctaFiledAt) {
        return res.status(400).json({ message: "Already escalated to the CTA" });
      }
      const parsed = z.object({ reference: z.string().trim().max(100).optional() }).safeParse(req.body ?? {});
      const reference = parsed.success ? parsed.data.reference : undefined;
      await storage.updateClaimStatus(id, "under-review", `Complaint filed with the Canadian Transportation Agency${reference ? ` (ref ${reference})` : ""}`);
      const updated = await storage.updateClaim(id, { ctaFiledAt: new Date() });
      await storage.addClaimEvent({
        claimId: id,
        type: "escalation",
        message: `Escalated to the CTA${reference ? ` (reference ${reference})` : ""}`,
        actorEmail: req.user?.email ?? null,
        metadata: { reference: reference ?? null },
      });
      void sendStageEmail(updated, "escalated", { actorEmail: req.user?.email });
      res.json({ message: "Escalation recorded and passenger notified", claim: updated });
    } catch (error) {
      console.error("Escalate error:", error);
      res.status(500).json({ message: "Failed to record escalation" });
    }
  });

  app.get("/api/admin/users", isSeniorAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(toPublicUser));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id/role", isSeniorAdmin, async (req, res) => {
    try {
      const parsed = z.object({ role: z.enum(USER_ROLES) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: `Role must be one of: ${USER_ROLES.join(", ")}` });
      }
      if (req.params.id === req.user?.id && parsed.data.role !== "senior_admin") {
        return res.status(400).json({ message: "You cannot remove your own senior admin role" });
      }
      const user = await storage.updateUserRole(req.params.id, parsed.data.role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(toPublicUser(user));
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/admin/marketing/send", isSeniorAdmin, async (req, res) => {
    try {
      const parsed = z
        .object({ subject: z.string().trim().min(1).max(200), message: z.string().trim().min(1).max(10000) })
        .safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Subject and message are required" });
      }
      if (!emailService.isConfigured()) {
        return res.status(503).json({ message: "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS." });
      }

      const recipients = await storage.getUsersWithMarketingConsent();
      let sent = 0;
      const failed: string[] = [];
      for (const recipient of recipients) {
        if (!recipient.email) continue;
        try {
          await emailService.sendMarketingEmail(recipient.email, { ...parsed.data, firstName: recipient.firstName });
          sent += 1;
        } catch (error) {
          console.error(`Marketing email to ${recipient.email} failed:`, error);
          failed.push(recipient.email);
        }
      }
      res.json({ message: `Campaign sent to ${sent} of ${recipients.length} opted-in users`, sent, failed: failed.length });
    } catch (error) {
      console.error("Marketing send error:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.post("/api/admin/export-sheets", isSeniorAdmin, async (_req, res) => {
    try {
      if (!googleSheetsService.isConfigured()) {
        return res.status(503).json({
          message: "Google Sheets export is not configured. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
        });
      }
      const claims = await storage.getAllClaims();
      const claimsData = claims.map((claim) => ({
        claimId: claim.claimId,
        passengerName: claim.passengerName,
        email: claim.email,
        flightNumber: claim.flightNumber,
        flightDate: claim.flightDate,
        departureAirport: claim.departureAirport,
        arrivalAirport: claim.arrivalAirport,
        issueType: claim.issueType,
        delayDuration: claim.delayDuration || "",
        delayReason: claim.delayReason || "",
        mealVouchers: claim.mealVouchers || "None",
        status: claim.status,
        compensationAmount: claim.compensationAmount ? Number(claim.compensationAmount) : undefined,
        commissionAmount: claim.commissionAmount ? Number(claim.commissionAmount) : undefined,
        poaRequested: claim.poaRequested ?? false,
        poaSigned: claim.poaSigned ?? false,
        poaConsent: claim.poaConsent,
        emailMarketingConsent: claim.emailMarketingConsentClaim ?? false,
        createdAt: claim.createdAt?.toISOString() || "",
        updatedAt: claim.updatedAt?.toISOString() || "",
      }));

      const sheetUrl = await googleSheetsService.exportClaimsToSheet(claimsData);
      res.json({ url: sheetUrl, message: "Claims exported to Google Sheets successfully" });
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error);
      res.status(500).json({ message: "Failed to export to Google Sheets" });
    }
  });

  // -------------------------------------------------------------------------
  // Power of Attorney signing (passenger, via signed link or own account)
  // -------------------------------------------------------------------------
  const loadClaimForPassenger = async (req: Parameters<RequestHandler>[0]) => {
    const claimId = req.params.claimId.trim();
    const token = typeof req.query.token === "string" ? req.query.token : typeof req.body?.token === "string" ? req.body.token : "";
    const claim = await storage.getClaimByClaimId(claimId);
    if (!claim) return { claim: undefined, allowed: false };
    const owns = !!req.user && (req.user.id === claim.userId || req.user.email?.toLowerCase() === claim.email.toLowerCase());
    const isAdmin = ["junior_admin", "senior_admin"].includes(req.user?.role ?? "user");
    const allowed = owns || isAdmin || (!!token && verifyClaimToken(claimId, token));
    return { claim, allowed };
  };

  app.get("/api/claims/:claimId/poa", async (req, res) => {
    try {
      const { claim, allowed } = await loadClaimForPassenger(req);
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      if (!allowed) return res.status(403).json({ message: "This link is not valid for this claim" });
      res.json({
        claimId: claim.claimId,
        passengerName: claim.passengerName,
        email: claim.email,
        flightNumber: claim.flightNumber,
        flightDate: claim.flightDate,
        departureAirport: claim.departureAirport,
        arrivalAirport: claim.arrivalAirport,
        compensationAmount: claim.compensationAmount,
        commissionAmount: claim.commissionAmount,
        language: claim.language,
        poaSigned: claim.poaSigned,
        poaSignedAt: claim.poaSignedAt,
        version: POA_VERSION,
      });
    } catch (error) {
      console.error("POA info error:", error);
      res.status(500).json({ message: "Failed to load claim" });
    }
  });

  app.post("/api/claims/:claimId/sign", async (req, res) => {
    try {
      const { claim, allowed } = await loadClaimForPassenger(req);
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      if (!allowed) return res.status(403).json({ message: "This link is not valid for this claim" });
      if (claim.poaSigned) return res.status(400).json({ message: "This Power of Attorney is already signed", code: "ALREADY_SIGNED" });
      const parsed = z
        .object({
          signature: z.string().startsWith("data:image/png;base64,").max(3 * 1024 * 1024),
          typedName: z.string().trim().min(2).max(120),
          agreed: z.literal(true),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "A drawn signature, your typed name and your agreement are required" });
      }

      const signedAt = new Date();
      const pdf = await renderPoaPdf(claim, {
        dataUrl: parsed.data.signature,
        typedName: parsed.data.typedName,
        signedAt,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      const filename = await storePoaPdf(UPLOADS_DIR, claim.claimId, pdf);
      const updated = await storage.updateClaim(claim.id, {
        poaSigned: true,
        poaSignedAt: signedAt,
        poaRequested: true,
        poaDocumentUrl: `/api/admin/uploads/${filename}`,
      });
      await consentManager.recordConsent({
        consentType: "poa",
        userEmail: claim.email,
        userName: parsed.data.typedName,
        claimId: claim.claimId,
        timestamp: signedAt.toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        documentVersion: POA_VERSION,
        agreed: true,
      });
      await storage.addClaimEvent({
        claimId: claim.id,
        type: "poa",
        message: `Power of Attorney signed electronically by ${parsed.data.typedName}`,
        actorEmail: claim.email,
        metadata: { filename, ip: req.ip },
      });
      void sendStageEmail(updated, "poa_signed", { attachments: [{ filename, content: pdf, contentType: "application/pdf" }] });
      res.json({ message: "Power of Attorney signed", poaSigned: true, downloadUrl: `/api/claims/${encodeURIComponent(claim.claimId)}/poa.pdf` });
    } catch (error) {
      console.error("POA sign error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to sign" });
    }
  });

  app.get("/api/claims/:claimId/poa.pdf", async (req, res) => {
    try {
      const { claim, allowed } = await loadClaimForPassenger(req);
      if (!claim) return res.status(404).json({ message: "Claim not found" });
      if (!allowed) return res.status(403).json({ message: "This link is not valid for this claim" });
      if (!claim.poaSigned) return res.status(404).json({ message: "Not signed yet" });
      res.setHeader("Content-Disposition", `inline; filename="${poaFileName(claim.claimId)}"`);
      res.sendFile(path.join(UPLOADS_DIR, poaFileName(claim.claimId)), (error) => {
        if (error && !res.headersSent) res.status(404).json({ message: "File not found" });
      });
    } catch (error) {
      console.error("POA download error:", error);
      res.status(500).json({ message: "Failed to load document" });
    }
  });

  // Stripe: checkout.session.completed marks the commission paid.
  app.post("/api/stripe/webhook", async (req, res) => {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !verifyStripeSignature(rawBody, req.get("Stripe-Signature"))) {
      return res.status(400).json({ message: "Invalid signature" });
    }
    try {
      const event = req.body as { type?: string; data?: { object?: { id?: string; payment_status?: string } } };
      if (event.type === "checkout.session.completed" && event.data?.object?.id && event.data.object.payment_status === "paid") {
        const claim = await storage.getClaimByStripeSession(event.data.object.id);
        if (claim && claim.paymentStatus !== "paid") {
          const updated = await storage.updateClaim(claim.id, { paymentStatus: "paid", paidAt: new Date() });
          await storage.updateClaimStatus(claim.id, "paid", "Commission paid through Stripe");
          await storage.addClaimEvent({ claimId: claim.id, type: "payment", message: "Commission paid through Stripe", metadata: { sessionId: event.data.object.id } });
          void sendStageEmail({ ...updated, status: "paid" }, "paid");
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // One-click unsubscribe (link signed with SESSION_SECRET, so it works without login).
  app.get("/api/unsubscribe", async (req, res) => {
    const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : "";
    const sig = typeof req.query.sig === "string" ? req.query.sig : "";
    try {
      if (!email || !sig || !verifyEmailSignature(email, sig)) {
        return res.redirect("/unsubscribed?ok=0");
      }
      const user = await storage.getUserByEmail(email);
      if (user) await storage.updateUser(user.id, { emailMarketingConsent: false });
      await consentManager.recordConsent({
        consentType: "emailMarketing",
        userEmail: email,
        userName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email : email,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        documentVersion: "1.0",
        agreed: false,
      });
      res.redirect("/unsubscribed?ok=1");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.redirect("/unsubscribed?ok=0");
    }
  });

  // -------------------------------------------------------------------------
  // FAQ, assistant, voice search
  // -------------------------------------------------------------------------
  app.get("/api/faqs", async (req, res) => {
    try {
      const { search } = req.query;
      const faqs =
        search && typeof search === "string" && search.trim()
          ? await storage.searchFaqs(search.trim())
          : await storage.getAllFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("FAQ retrieval error:", error);
      res.status(500).json({ message: "Failed to retrieve FAQs" });
    }
  });

  app.post("/api/chatbot", async (req, res) => {
    try {
      const parsed = z.object({ query: z.string().trim().min(1).max(2000), context: z.string().max(2000).optional() }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please enter a question", isHelpful: false });
      }
      res.json(await handleChatbotQuery(parsed.data.query, parsed.data.context));
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({
        message: "I'm experiencing technical difficulties. Please contact our support team.",
        isHelpful: false,
      });
    }
  });

  app.post("/api/voice-search", async (req, res) => {
    try {
      const parsed = z.object({ query: z.string().trim().min(1).max(2000) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please say or type a question" });
      }
      const faqs = await storage.searchFaqs(parsed.data.query);
      if (faqs.length === 0) {
        const chatbotResponse = await handleChatbotQuery(parsed.data.query);
        return res.json({ type: "chatbot", response: chatbotResponse.message });
      }
      res.json({ type: "faq", faqs: faqs.slice(0, 3) });
    } catch (error) {
      console.error("Voice search error:", error);
      res.status(500).json({ message: "Voice search failed" });
    }
  });

  // Real numbers only; nothing invented when the database is empty.
  app.get("/api/stats", async (_req, res) => {
    try {
      const claims = await storage.getAllClaims();
      const paidClaims = claims.filter((claim) => claim.status === "paid");
      const totalCompensation = paidClaims.reduce((sum, claim) => sum + Number(claim.compensationAmount ?? 0), 0);
      res.json({
        totalClaims: claims.length,
        successRate: claims.length > 0 ? Math.round((paidClaims.length / claims.length) * 100) : 0,
        avgCompensation: paidClaims.length > 0 ? Math.round(totalCompensation / paidClaims.length) : 0,
        commissionRate: 15,
      });
    } catch (error) {
      console.error("Stats retrieval error:", error);
      res.status(500).json({ message: "Failed to load statistics" });
    }
  });

  // -------------------------------------------------------------------------
  // Consent audit trail (admin only; contains names, emails and IP addresses)
  // -------------------------------------------------------------------------
  app.get("/api/consent/audit/:email", isSeniorAdmin, async (req, res) => {
    try {
      res.json(await consentManager.generateUserAuditTrail(req.params.email));
    } catch (error) {
      console.error("Error fetching consent audit trail:", error);
      res.status(500).json({ message: "Failed to fetch consent audit trail" });
    }
  });

  app.post("/api/consent/validate", isSeniorAdmin, async (req, res) => {
    try {
      const parsed = z.object({ email: z.string().email(), requiredConsents: z.array(z.string()).default([]) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "email and requiredConsents are required" });
      }
      res.json(await consentManager.validateUserConsent(parsed.data.email, parsed.data.requiredConsents));
    } catch (error) {
      console.error("Error validating consent:", error);
      res.status(500).json({ message: "Failed to validate consent" });
    }
  });

  app.get("/api/consent/export", isSeniorAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = typeof startDate === "string" && startDate ? new Date(startDate) : undefined;
      const end = typeof endDate === "string" && endDate ? new Date(endDate) : undefined;
      res.json(await consentManager.exportConsentRecords(start, end));
    } catch (error) {
      console.error("Error exporting consent records:", error);
      res.status(500).json({ message: "Failed to export consent records" });
    }
  });

  app.post("/api/consent/record", isAuthenticated, async (req, res) => {
    try {
      const parsed = consentRecordInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid consent record" });
      }
      const filename = await consentManager.recordConsent({
        ...parsed.data,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
      res.json({ message: "Consent recorded successfully", filename });
    } catch (error) {
      console.error("Error recording consent:", error);
      res.status(500).json({ message: "Failed to record consent" });
    }
  });

  return createServer(app);
}
