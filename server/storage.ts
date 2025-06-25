import { claims, faqItems, type Claim, type InsertClaim, type FaqItem, type InsertFaqItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Claims operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaimById(id: number): Promise<Claim | undefined>;
  getClaimByClaimId(claimId: string): Promise<Claim | undefined>;
  getClaimsByEmail(email: string): Promise<Claim[]>;
  updateClaimStatus(id: number, status: string, notes?: string): Promise<Claim>;
  updateClaimCompensation(id: number, compensationAmount: number, commissionAmount: number): Promise<Claim>;
  updateClaimPOA(id: number, poaSigned: boolean, poaDocumentUrl?: string): Promise<Claim>;
  updateClaimEligibility(id: number, validation: { isEligible: boolean; confidence: number; reason: string }): Promise<Claim>;
  getAllClaims(): Promise<Claim[]>;

  // FAQ operations
  getAllFaqs(): Promise<FaqItem[]>;
  createFaq(faq: InsertFaqItem): Promise<FaqItem>;
  updateFaq(id: number, faq: Partial<InsertFaqItem>): Promise<FaqItem>;
  deleteFaq(id: number): Promise<void>;
  searchFaqs(query: string): Promise<FaqItem[]>;
}

export class DatabaseStorage implements IStorage {
  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    // Generate unique claim ID
    const claimId = `CLM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const claimData = {
      ...insertClaim,
      claimId,
      statusHistory: [{
        status: 'submitted',
        timestamp: new Date().toISOString(),
        notes: 'Claim submitted successfully'
      }]
    };

    const [claim] = await db
      .insert(claims)
      .values([claimData])
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
    return await db.select().from(claims).where(eq(claims.email, email)).orderBy(desc(claims.createdAt));
  }

  async updateClaimStatus(id: number, status: string, notes?: string): Promise<Claim> {
    const claim = await this.getClaimById(id);
    if (!claim) throw new Error('Claim not found');

    const newStatusEntry = {
      status,
      timestamp: new Date().toISOString(),
      notes
    };

    const updatedHistory = [...(claim.statusHistory || []), newStatusEntry];

    const [updatedClaim] = await db
      .update(claims)
      .set({
        status,
        statusHistory: updatedHistory,
        updatedAt: new Date()
      })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimCompensation(id: number, compensationAmount: number, commissionAmount: number): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({
        compensationAmount: compensationAmount.toString(),
        commissionAmount: commissionAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimPOA(id: number, poaSigned: boolean, poaDocumentUrl?: string): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({
        poaSigned,
        poaDocumentUrl,
        updatedAt: new Date()
      })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async updateClaimEligibility(id: number, validation: { isEligible: boolean; confidence: number; reason: string }): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({
        eligibilityValidation: validation,
        updatedAt: new Date()
      })
      .where(eq(claims.id, id))
      .returning();

    return updatedClaim;
  }

  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims).orderBy(desc(claims.createdAt));
  }

  async getAllFaqs(): Promise<FaqItem[]> {
    return await db.select().from(faqItems).where(eq(faqItems.isActive, true)).orderBy(faqItems.order);
  }

  async createFaq(insertFaq: InsertFaqItem): Promise<FaqItem> {
    const [faq] = await db.insert(faqItems).values(insertFaq).returning();
    return faq;
  }

  async updateFaq(id: number, faqData: Partial<InsertFaqItem>): Promise<FaqItem> {
    const [updatedFaq] = await db
      .update(faqItems)
      .set(faqData)
      .where(eq(faqItems.id, id))
      .returning();
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
          or(
            ilike(faqItems.question, `%${query}%`),
            ilike(faqItems.answer, `%${query}%`)
          )
        )
      )
      .orderBy(faqItems.order);
  }
}

export const storage = new DatabaseStorage();
