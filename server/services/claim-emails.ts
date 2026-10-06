/**
 * Bilingual passenger emails for each stage of a claim. Every send is logged
 * as a claim event so the admin timeline shows what the passenger received.
 */
import type { Claim } from "@shared/schema";
import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";
import { emailService } from "./email";
import { storage } from "../storage";
import { appUrl, signPoaUrl } from "../config";

export type ClaimStage =
  | "submitted"
  | "sent_to_airline"
  | "escalated"
  | "approved"
  | "rejected"
  | "paid"
  | "payment_link"
  | "poa_signed";

interface StageCopy {
  subject: string;
  intro: string;
  body: string[];
  action?: { label: string; url: string };
}

function money(value?: string | null): string {
  return value ? `$${Number(value).toFixed(0)} CAD` : "";
}

function copyFor(claim: Claim, stage: ClaimStage, extras: { paymentLink?: string } = {}): StageCopy {
  const fr = claim.language === "fr";
  const id = claim.claimId;
  const comp = money(claim.compensationAmount);
  const fee = money(claim.commissionAmount);
  const net = claim.compensationAmount && claim.commissionAmount ? money(String(Number(claim.compensationAmount) - Number(claim.commissionAmount))) : "";
  const track = `${appUrl()}/my-claims`;
  const needsReview = claim.eligibilityValidation?.needsReview;

  switch (stage) {
    case "submitted":
      return fr
        ? {
            subject: `Réclamation reçue – ${id}`,
            intro: `Nous avons bien reçu votre réclamation pour le vol ${claim.flightNumber} du ${claim.flightDate}.`,
            body: [
              `Votre numéro de réclamation est ${id}. Conservez-le : il figure dans chacun de nos courriels.`,
              comp ? `Indemnisation RPPA estimée : ${comp}. Notre commission de 15 % (${fee}) n'est prélevée que si vous gagnez.` : `Nous vérifierons l'admissibilité auprès de la compagnie avant de confirmer un montant.`,
              needsReview ? `La cause de la perturbation sera confirmée auprès de la compagnie.` : ``,
              claim.poaSigned ? `` : `Prochaine étape : signez la procuration pour que nous puissions agir en votre nom.`,
            ],
            action: claim.poaSigned ? { label: "Suivre ma réclamation", url: track } : { label: "Signer la procuration", url: signPoaUrl(id) },
          }
        : {
            subject: `Claim received – ${id}`,
            intro: `We have received your claim for flight ${claim.flightNumber} on ${claim.flightDate}.`,
            body: [
              `Your Claim ID is ${id}. Keep it: we quote it in every email.`,
              comp ? `Estimated APPR compensation: ${comp}. Our 15% commission (${fee}) is only collected if you win.` : `We will confirm eligibility with the airline before confirming an amount.`,
              needsReview ? `The cause of the disruption will be confirmed with the airline.` : ``,
              claim.poaSigned ? `` : `Next step: sign the Power of Attorney so we can act on your behalf.`,
            ],
            action: claim.poaSigned ? { label: "Track my claim", url: track } : { label: "Sign the Power of Attorney", url: signPoaUrl(id) },
          };
    case "sent_to_airline":
      return fr
        ? {
            subject: `Réclamation transmise à la compagnie – ${id}`,
            intro: `Nous avons transmis votre réclamation à la compagnie aérienne.`,
            body: [`En vertu du RPPA, elle dispose de 30 jours pour répondre. Nous vous écrirons dès que nous aurons une réponse, ou si nous devons porter le dossier à l'Office des transports du Canada.`],
            action: { label: "Suivre ma réclamation", url: track },
          }
        : {
            subject: `Claim sent to the airline – ${id}`,
            intro: `We have sent your claim to the airline.`,
            body: [`Under the APPR the airline has 30 days to respond. We will write as soon as we hear back, or if we need to escalate to the Canadian Transportation Agency.`],
            action: { label: "Track my claim", url: track },
          };
    case "escalated":
      return fr
        ? {
            subject: `Dossier porté à l'Office des transports du Canada – ${id}`,
            intro: `La compagnie n'a pas réglé votre réclamation dans les délais, alors nous l'avons portée à l'Office des transports du Canada (OTC).`,
            body: [`Le traitement par l'OTC peut prendre plusieurs mois. Aucune action n'est requise de votre part; nous vous tiendrons au courant.`],
            action: { label: "Suivre ma réclamation", url: track },
          }
        : {
            subject: `Claim escalated to the Canadian Transportation Agency – ${id}`,
            intro: `The airline did not resolve your claim in time, so we have escalated it to the Canadian Transportation Agency (CTA).`,
            body: [`CTA processing can take several months. Nothing is needed from you; we will keep you posted.`],
            action: { label: "Track my claim", url: track },
          };
    case "approved":
      return fr
        ? {
            subject: `Bonne nouvelle : réclamation approuvée – ${id}`,
            intro: `La compagnie a accepté votre réclamation.`,
            body: [comp ? `Montant accordé : ${comp}. Notre commission de 15 % : ${fee}. Vous recevrez ${net}.` : ``, `Nous vous écrirons dès que le paiement sera traité.`],
            action: { label: "Suivre ma réclamation", url: track },
          }
        : {
            subject: `Good news: claim approved – ${id}`,
            intro: `The airline has accepted your claim.`,
            body: [comp ? `Amount awarded: ${comp}. Our 15% commission: ${fee}. You will receive ${net}.` : ``, `We will write again as soon as payment is processed.`],
            action: { label: "Track my claim", url: track },
          };
    case "rejected":
      return fr
        ? {
            subject: `Mise à jour de votre réclamation – ${id}`,
            intro: `Malheureusement, votre réclamation n'a pas été retenue.`,
            body: [`Après vérification auprès de la compagnie, la perturbation n'est pas indemnisable en vertu du RPPA. Vous ne nous devez rien.`, `Si vous avez de nouveaux éléments, écrivez-nous à ${SUPPORT_EMAIL}.`],
          }
        : {
            subject: `Update on your claim – ${id}`,
            intro: `Unfortunately your claim was not successful.`,
            body: [`After checking with the airline, the disruption is not compensable under the APPR. You owe us nothing.`, `If you have new information, write to ${SUPPORT_EMAIL}.`],
          };
    case "paid":
      return fr
        ? {
            subject: `Paiement complété – ${id}`,
            intro: `Votre dossier est clos : l'indemnisation a été versée.`,
            body: [net ? `Après notre commission de 15 % (${fee}), vous recevez ${net}.` : ``, `Merci d'avoir fait confiance à ${BRAND_NAME}.`],
          }
        : {
            subject: `Payment complete – ${id}`,
            intro: `Your claim is closed: the compensation has been paid.`,
            body: [net ? `After our 15% commission (${fee}), you receive ${net}.` : ``, `Thank you for trusting ${BRAND_NAME}.`],
          };
    case "payment_link":
      return fr
        ? {
            subject: `Facture de commission – ${id}`,
            intro: `La compagnie vous a versé l'indemnisation directement. Voici notre facture pour la commission convenue.`,
            body: [comp ? `Indemnisation reçue : ${comp}. Commission de 15 % : ${fee}.` : ``, extras.paymentLink ? `Payez en ligne en toute sécurité avec le bouton ci-dessous.` : `Veuillez effectuer un virement Interac à ${SUPPORT_EMAIL} en indiquant votre numéro de réclamation.`],
            action: extras.paymentLink ? { label: `Payer ${fee}`, url: extras.paymentLink } : undefined,
          }
        : {
            subject: `Commission invoice – ${id}`,
            intro: `The airline paid your compensation directly. Here is our invoice for the agreed commission.`,
            body: [comp ? `Compensation received: ${comp}. 15% commission: ${fee}.` : ``, extras.paymentLink ? `Pay securely online with the button below.` : `Please send an Interac e-Transfer to ${SUPPORT_EMAIL} quoting your Claim ID.`],
            action: extras.paymentLink ? { label: `Pay ${fee}`, url: extras.paymentLink } : undefined,
          };
    case "poa_signed":
      return fr
        ? {
            subject: `Procuration signée – ${id}`,
            intro: `Merci! Votre procuration est signée et jointe à ce courriel.`,
            body: [`Nous pouvons maintenant agir en votre nom auprès de la compagnie. Vous pouvez révoquer cette procuration en tout temps avec un préavis de 7 jours à ${SUPPORT_EMAIL}.`],
            action: { label: "Suivre ma réclamation", url: track },
          }
        : {
            subject: `Power of Attorney signed – ${id}`,
            intro: `Thank you! Your Power of Attorney is signed and attached to this email.`,
            body: [`We can now act on your behalf with the airline. You can revoke it at any time with 7 days notice to ${SUPPORT_EMAIL}.`],
            action: { label: "Track my claim", url: track },
          };
  }
}

function render(claim: Claim, copy: StageCopy) {
  const fr = claim.language === "fr";
  const greeting = fr ? `Bonjour ${claim.passengerName},` : `Dear ${claim.passengerName},`;
  const closing = fr ? `Cordialement,<br>L'équipe ${BRAND_NAME}` : `Best regards,<br>The ${BRAND_NAME} Team`;
  const paragraphs = copy.body.filter(Boolean);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>${greeting}</p>
      <p><strong>${copy.intro}</strong></p>
      ${paragraphs.map((line) => `<p>${line}</p>`).join("")}
      ${copy.action ? `<p><a href="${copy.action.url}" style="display:inline-block;padding:10px 16px;background:#000080;color:#fff;text-decoration:none;">${copy.action.label}</a></p>` : ""}
      <p style="font-size:12px;color:#666;">${fr ? "Numéro de réclamation" : "Claim ID"}: ${claim.claimId}</p>
      <p>${closing}</p>
    </div>`;
  const text = [greeting, "", copy.intro, ...paragraphs, copy.action ? `${copy.action.label}: ${copy.action.url}` : "", `${fr ? "Numéro de réclamation" : "Claim ID"}: ${claim.claimId}`, "", closing.replace("<br>", "\n")]
    .filter((line) => line !== undefined)
    .join("\n");
  return { subject: copy.subject, html, text };
}

/** Send the email for a stage and log it on the claim. Never throws. */
export async function sendStageEmail(
  claim: Claim,
  stage: ClaimStage,
  options: { actorEmail?: string | null; paymentLink?: string; attachments?: { filename: string; content: Buffer; contentType?: string }[] } = {},
): Promise<boolean> {
  const copy = copyFor(claim, stage, { paymentLink: options.paymentLink });
  const mail = render(claim, copy);
  let sent = false;
  try {
    sent = await emailService.sendMail({ to: claim.email, ...mail, attachments: options.attachments });
  } catch (error) {
    console.error(`Stage email ${stage} failed for ${claim.claimId}:`, error);
  }
  try {
    await storage.addClaimEvent({
      claimId: claim.id,
      type: "email",
      message: sent ? `Email sent: "${copy.subject}"` : `Email NOT sent (SMTP not configured): "${copy.subject}"`,
      actorEmail: options.actorEmail ?? null,
      metadata: { stage, sent, to: claim.email },
    });
  } catch (error) {
    console.error("Could not log email event:", error);
  }
  return sent;
}
