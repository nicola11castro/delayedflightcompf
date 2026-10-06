import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { createHash, randomBytes, randomUUID } from "crypto";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertClaimSchema, CLAIM_STATUSES, USER_ROLES, type Claim } from "@shared/schema";
import { estimateCompensation, getDelayReasonValidity, isDelayBand, type CompensationEstimate } from "@shared/appr";
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
  .omit({ documentsUrls: true, boardingPassUrl: true, poaDocumentUrl: true, status: true })
  .extend({
    passengerName: z.string().trim().min(1, "Passenger name is required"),
    email: z.string().trim().toLowerCase().email("A valid email address is required"),
    flightNumber: z.string().trim().min(2, "Flight number is required"),
    flightDate: z.string().trim().min(1, "Flight date is required"),
    departureAirport: z.string().trim().min(1, "Departure airport is required"),
    arrivalAirport: z.string().trim().min(1, "Arrival airport is required"),
    issueType: z.enum(["delayed", "cancelled", "denied-boarding", "missed-connection"]),
    delayDuration: z.string().refine(isDelayBand, { message: "Delay duration must be 3-6, 6-9 or 9+ hours" }),
    delayReason: z.string().min(1, "Delay reason is required"),
    mealVouchers: z.string().trim().max(100).optional(),
    poaConsent: formBoolean.refine((value) => value === true, {
      message: "Power of Attorney consent is required to proceed with claim",
    }),
    poaRequested: formBoolean.optional(),
    emailMarketingConsentClaim: formBoolean.optional(),
    allClaimConsentsAccepted: formBoolean.optional(),
  });

const calculatorSchema = z.object({
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

/** Non-blocking follow-ups after a claim is saved: AI second opinion, Airtable mirror, confirmation email. */
async function runClaimFollowUps(claim: Claim, estimate: CompensationEstimate) {
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

  try {
    await emailService.sendClaimConfirmation(claim.email, {
      claimId: claim.claimId,
      passengerName: claim.passengerName,
      flightNumber: claim.flightNumber,
      flightDate: claim.flightDate,
      estimatedCompensation: claim.compensationAmount ? Number(claim.compensationAmount) : undefined,
      commissionAmount: claim.commissionAmount ? Number(claim.commissionAmount) : undefined,
    });
  } catch (error) {
    console.error("Confirmation email failed:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
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

      if (!getDelayReasonValidity(data.delayReason)) {
        await removeFiles(files);
        return res.status(400).json({
          message: "This delay reason is not eligible for compensation under the APPR, so we cannot take the claim.",
          code: "NOT_ADMISSIBLE",
        });
      }

      const claimId = generateClaimId(data.email);
      const estimate = estimateCompensation({
        flightNumber: data.flightNumber,
        delayDuration: data.delayDuration,
        delayReason: data.delayReason,
        mealVouchers: data.mealVouchers,
      });

      const claim = await storage.createClaim(
        {
          ...data,
          poaRequested: data.poaRequested ?? false,
          emailMarketingConsentClaim: data.emailMarketingConsentClaim ?? false,
          allClaimConsentsAccepted: data.poaConsent,
          documentsUrls: files.map((file) => `/api/admin/uploads/${file.filename}`),
          compensationAmount: estimate.eligible ? estimate.compensationAmount.toFixed(2) : null,
          commissionAmount: estimate.eligible ? estimate.commissionAmount.toFixed(2) : null,
          eligibilityValidation: {
            isEligible: estimate.eligible,
            confidence: estimate.carrierKnown ? 0.9 : 0.6,
            reason: estimate.reason,
            source: "rules",
          },
        },
        claimId,
      );

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
      const email = req.user?.email;
      res.json(email ? await storage.getClaimsByEmail(email) : []);
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
      const claim = await storage.updateClaimStatus(id, status, historyNote);

      emailService
        .sendStatusUpdate(claim.email, {
          claimId: claim.claimId,
          passengerName: claim.passengerName,
          newStatus: status,
          statusMessage: notes || STATUS_MESSAGES[status],
        })
        .catch((error) => console.error("Status update email failed:", error));

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

  app.post("/api/admin/claims/:id/email-airline", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const to = process.env.AIRLINE_CLAIMS_EMAIL;
      if (!to) {
        return res.status(503).json({
          message: "Set AIRLINE_CLAIMS_EMAIL (the airline's claims inbox, or your own inbox to forward manually) before sending claim letters.",
        });
      }
      if (!emailService.isConfigured()) {
        return res.status(503).json({ message: "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS." });
      }

      await emailService.sendAirlineClaimLetter(to, claim);
      const nextStatus = claim.status === "submitted" ? "under-review" : claim.status;
      const updated = await storage.updateClaimStatus(
        claim.id,
        nextStatus,
        `Claim letter emailed to ${to} by ${req.user?.email ?? "admin"}`,
      );
      res.json({ message: `Claim letter sent to ${to}`, claim: updated });
    } catch (error) {
      console.error("Email airline error:", error);
      res.status(500).json({ message: "Failed to send the claim letter" });
    }
  });

  app.post("/api/admin/claims/:id/invoice", isJuniorAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const claim = Number.isInteger(id) ? await storage.getClaimById(id) : undefined;
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      if (!claim.compensationAmount || !claim.commissionAmount) {
        return res.status(400).json({ message: "This claim has no compensation amount yet" });
      }
      if (!emailService.isConfigured()) {
        return res.status(503).json({ message: "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS." });
      }

      await emailService.sendCommissionInvoice(claim.email, {
        claimId: claim.claimId,
        passengerName: claim.passengerName,
        compensationAmount: Number(claim.compensationAmount),
        commissionAmount: Number(claim.commissionAmount),
        paymentInstructions:
          process.env.PAYMENT_INSTRUCTIONS ||
          "Please send the commission amount by Interac e-Transfer to billing@yulclaims.com, quoting your Claim ID.",
      });
      await storage.updateClaimStatus(claim.id, claim.status, `Commission invoice emailed by ${req.user?.email ?? "admin"}`);
      res.json({ message: `Invoice emailed to ${claim.email}` });
    } catch (error) {
      console.error("Invoice email error:", error);
      res.status(500).json({ message: "Failed to send the invoice" });
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
