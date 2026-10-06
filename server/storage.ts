import {
  claims,
  faqItems,
  users,
  consentRecords,
  type Claim,
  type FaqItem,
  type InsertFaqItem,
  type User,
  type UpsertUser,
  type UserRole,
  type ConsentRecord,
  type InsertConsentRecord,
  authTokens,
  type AuthToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, gte, lte, isNull, gt } from "drizzle-orm";

/** Everything needed to insert a claim except the server-generated fields. */
export type NewClaim = Omit<
  typeof claims.$inferInsert,
  "id" | "claimId" | "createdAt" | "updatedAt" | "statusHistory"
>;

export type EligibilityValidation = NonNullable<Claim["eligibilityValidation"]>;

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: UserRole): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersWithMarketingConsent(): Promise<User[]>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;

  // One-time tokens (password reset, email verification)
  createAuthToken(userId: string, type: string, tokenHash: string, expiresAt: Date): Promise<AuthToken>;
  findValidAuthToken(type: string, tokenHash: string): Promise<AuthToken | undefined>;
  consumeAuthToken(id: number): Promise<void>;

  // Claims operations
  createClaim(claim: NewClaim, claimId: string): Promise<Claim>;
  getClaimById(id: number): Promise<Claim | undefined>;
  getClaimByClaimId(claimId: string): Promise<Claim | undefined>;
  getClaimsByEmail(email: string): Promise<Claim[]>;
  getClaimsForUser(userId: string, email?: string | null): Promise<Claim[]>;
  updateClaimStatus(id: number, status: string, notes?: string): Promise<Claim>;
  updateClaimCompensation(id: number, compensationAmount: number, commissionAmount: number): Promise<Claim>;
  updateClaimPOA(id: number, poaSigned: boolean, poaDocumentUrl?: string): Promise<Claim>;
  updateClaimEligibility(id: number, validation: EligibilityValidation): Promise<Claim>;
  getAllClaims(): Promise<Claim[]>;

  // FAQ operations
  getAllFaqs(): Promise<FaqItem[]>;
  createFaq(faq: InsertFaqItem): Promise<FaqItem>;
  updateFaq(id: number, faq: Partial<InsertFaqItem>): Promise<FaqItem>;
  deleteFaq(id: number): Promise<void>;
  searchFaqs(query: string): Promise<FaqItem[]>;

  // Consent audit trail
  createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord>;
  getConsentRecordsByEmail(email: string): Promise<ConsentRecord[]>;
  getConsentRecords(start?: Date, end?: Date): Promise<ConsentRecord[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersWithMarketingConsent(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.emailMarketingConsent, true));
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // One-time tokens
  async createAuthToken(userId: string, type: string, tokenHash: string, expiresAt: Date): Promise<AuthToken> {
    const [token] = await db.insert(authTokens).values({ userId, type, tokenHash, expiresAt }).returning();
    return token;
  }

  async findValidAuthToken(type: string, tokenHash: string): Promise<AuthToken | undefined> {
    const [token] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.type, type),
          eq(authTokens.tokenHash, tokenHash),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, new Date()),
        ),
      );
    return token;
  }

  async consumeAuthToken(id: number): Promise<void> {
    await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, id));
  }

  // Claims operations
  async createClaim(insertClaim: NewClaim, claimId: string): Promise<Claim> {
    const [claim] = await db
      .insert(claims)
      .values({
        ...insertClaim,
        claimId,
        statusHistory: [
          {
            status: "submitted",
            timestamp: new Date().toISOString(),
            notes: "Claim submitted successfully",
          },
        ],
      })
      .returning();
    return claim;
  }

  async getClaimById(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.claimId, claimId));
    return claim;
  }

  async getClaimsByEmail(email: string): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(eq(claims.email, email.toLowerCase()))
      .orderBy(desc(claims.createdAt));
  }

  async getClaimsForUser(userId: string, email?: string | null): Promise<Claim[]> {
    const condition = email
      ? or(eq(claims.userId, userId), eq(claims.email, email.toLowerCase()))
      : eq(claims.userId, userId);
    return await db.select().from(claims).where(condition).orderBy(desc(claims.createdAt));
  }

  async updateClaimStatus(id: number, status: string, notes?: string): Promise<Claim> {
    const claim = await this.getClaimById(id);
    if (!claim) throw new Error("Claim not found");

    const updatedHistory = [
      ...(claim.statusHistory || []),
      { status, timestamp: new Date().toISOString(), notes },
    ];

    const [updatedClaim] = await db
      .update(claims)
      .set({ status, statusHistory: updatedHistory, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimCompensation(id: number, compensationAmount: number, commissionAmount: number): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({
        compensationAmount: compensationAmount.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimPOA(id: number, poaSigned: boolean, poaDocumentUrl?: string): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ poaSigned, poaDocumentUrl, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimEligibility(id: number, validation: EligibilityValidation): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ eligibilityValidation: validation, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims).orderBy(desc(claims.createdAt));
  }

  // FAQ operations
  async getAllFaqs(): Promise<FaqItem[]> {
    return await db.select().from(faqItems).where(eq(faqItems.isActive, true)).orderBy(faqItems.order);
  }

  async createFaq(insertFaq: InsertFaqItem): Promise<FaqItem> {
    const [faq] = await db.insert(faqItems).values(insertFaq).returning();
    return faq;
  }

  async updateFaq(id: number, faqData: Partial<InsertFaqItem>): Promise<FaqItem> {
    const [updatedFaq] = await db.update(faqItems).set(faqData).where(eq(faqItems.id, id)).returning();
    return updatedFaq;
  }

  async deleteFaq(id: number): Promise<void> {
    await db.update(faqItems).set({ isActive: false }).where(eq(faqItems.id, id));
  }

  async searchFaqs(query: string): Promise<FaqItem[]> {
    return await db
      .select()
      .from(faqItems)
      .where(
        and(
          eq(faqItems.isActive, true),
          or(ilike(faqItems.question, `%${query}%`), ilike(faqItems.answer, `%${query}%`)),
        ),
      )
      .orderBy(faqItems.order);
  }

  // Consent audit trail
  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    const [created] = await db.insert(consentRecords).values(record).returning();
    return created;
  }

  async getConsentRecordsByEmail(email: string): Promise<ConsentRecord[]> {
    return await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userEmail, email.toLowerCase()))
      .orderBy(desc(consentRecords.recordedAt));
  }

  async getConsentRecords(start?: Date, end?: Date): Promise<ConsentRecord[]> {
    const conditions = [];
    if (start) conditions.push(gte(consentRecords.recordedAt, start));
    if (end) conditions.push(lte(consentRecords.recordedAt, end));
    const query = db.select().from(consentRecords);
    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }
}

export const storage = new DatabaseStorage();
