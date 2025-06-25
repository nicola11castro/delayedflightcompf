import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimId: varchar("claim_id", { length: 50 }).notNull().unique(),
  passengerName: text("passenger_name").notNull(),
  email: text("email").notNull(),
  flightNumber: text("flight_number").notNull(),
  flightDate: text("flight_date").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  issueType: text("issue_type").notNull(), // delayed, cancelled, denied-boarding, missed-connection
  delayDuration: text("delay_duration"), // 3-6, 6-9, 9+
  delayReason: text("delay_reason"),
  boardingPassUrl: text("boarding_pass_url"),
  documentsUrls: jsonb("documents_urls").$type<string[]>().default([]),
  status: text("status").notNull().default("submitted"), // submitted, under-review, approved, rejected, paid
  compensationAmount: decimal("compensation_amount", { precision: 10, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  poaRequested: boolean("poa_requested").default(false),
  poaSigned: boolean("poa_signed").default(false),
  poaDocumentUrl: text("poa_document_url"),
  eligibilityValidation: jsonb("eligibility_validation").$type<{
    isEligible: boolean;
    confidence: number;
    reason: string;
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

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  claimId: true,
  createdAt: true,
  updatedAt: true,
  statusHistory: true,
});

export const insertFaqSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
});

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqSchema>;
