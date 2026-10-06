import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table used by express-session (connect-pg-simple).
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User accounts. Passwords are stored as scrypt hashes; users imported from the
// old Replit login have no hash until they register a password.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, junior_admin, senior_admin
  // Registration consents
  termsAccepted: boolean("terms_accepted").default(false),
  privacyAccepted: boolean("privacy_accepted").default(false),
  dataRetentionAccepted: boolean("data_retention_accepted").default(false),
  emailMarketingConsent: boolean("email_marketing_consent").default(false),
  emailVerified: boolean("email_verified").default(false),
  preferredLanguage: varchar("preferred_language", { length: 5 }).default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// One-time tokens for password resets and email verification (hash stored, never the token).
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    type: varchar("type", { length: 30 }).notNull(), // password_reset | email_verify
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("IDX_auth_tokens_hash").on(table.tokenHash)],
);

export const USER_ROLES = ["user", "junior_admin", "senior_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CLAIM_STATUSES = ["submitted", "under-review", "approved", "rejected", "paid"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimId: varchar("claim_id", { length: 50 }).notNull().unique(),
  userId: varchar("user_id"), // set when the passenger was signed in
  language: varchar("language", { length: 5 }).default("en"),
  passengerName: text("passenger_name").notNull(),
  email: text("email").notNull(),
  flightNumber: text("flight_number").notNull(),
  flightDate: text("flight_date").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  issueType: text("issue_type").notNull(), // delayed, cancelled, denied-boarding, missed-connection
  delayDuration: text("delay_duration"), // 3-6, 6-9, 9+
  delayReason: text("delay_reason"),
  mealVouchers: text("meal_vouchers"), // CAD amount of meal vouchers received
  boardingPassUrl: text("boarding_pass_url"),
  documentsUrls: jsonb("documents_urls").$type<string[]>().default([]),
  status: text("status").notNull().default("submitted"), // submitted, under-review, approved, rejected, paid
  compensationAmount: decimal("compensation_amount", { precision: 10, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  poaRequested: boolean("poa_requested").default(false),
  poaSigned: boolean("poa_signed").default(false),
  poaDocumentUrl: text("poa_document_url"),
  // Claim-specific consents (stored per claim)
  poaConsent: boolean("poa_consent").notNull().default(false),
  allClaimConsentsAccepted: boolean("all_claim_consents_accepted").default(false),
  emailMarketingConsentClaim: boolean("email_marketing_consent_claim").default(false),
  eligibilityValidation: jsonb("eligibility_validation").$type<{
    isEligible: boolean;
    confidence: number;
    reason: string;
    source?: "rules" | "ai";
    needsReview?: boolean;
  }>(),
  statusHistory: jsonb("status_history").$type<Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consent audit trail. The database is the source of truth; the JSON files in
// consent-records/ are a convenience copy and are lost on hosts with
// ephemeral disks.
export const consentRecords = pgTable(
  "consent_records",
  {
    id: serial("id").primaryKey(),
    consentType: varchar("consent_type", { length: 50 }).notNull(),
    userEmail: varchar("user_email").notNull(),
    userName: varchar("user_name").notNull(),
    claimId: varchar("claim_id", { length: 50 }),
    documentVersion: varchar("document_version", { length: 20 }).notNull(),
    agreed: boolean("agreed").notNull().default(true),
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    filename: varchar("filename"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => [index("IDX_consent_user_email").on(table.userEmail)],
);

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  claimId: true,
  createdAt: true,
  updatedAt: true,
  statusHistory: true,
  compensationAmount: true,
  commissionAmount: true,
  poaSigned: true,
  eligibilityValidation: true,
}).extend({
  delayDuration: z.string().min(1, "Delay duration is required"),
  delayReason: z.string().min(1, "Delay reason is required"),
  poaConsent: z.boolean().refine((val) => val === true, {
    message: "Power of Attorney consent is required to proceed with claim",
  }),
}).partial({
  emailMarketingConsentClaim: true,
  poaRequested: true,
  mealVouchers: true,
  poaDocumentUrl: true,
  boardingPassUrl: true,
  documentsUrls: true,
  status: true,
  allClaimConsentsAccepted: true,
  userId: true,
  language: true,
});

export const insertFaqSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
});

export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({
  id: true,
  recordedAt: true,
});

// Auth payloads shared by the register/login pages and the server.
export const registerUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  allConsentsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept all Terms of Service and agreements",
  }),
  emailMarketingConsent: z.boolean().optional().default(false),
  preferredLanguage: z.enum(["en", "fr"]).optional().default("en"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type AuthToken = typeof authTokens.$inferSelect;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
