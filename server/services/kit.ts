/**
 * Self-serve claim kit: what a passenger needs to claim on their own, in their
 * language. Eligibility summary, evidence checklist, demand letter, 30-day
 * countdown and next steps (CTA or Québec small claims).
 */
import type { Claim } from "@shared/schema";
import { BRAND_NAME, SUPPORT_EMAIL, DOMAIN } from "@shared/brand";
import { delayReasons, getAirlineByFlightNumber, getReasonStatus } from "@shared/appr";
import { PdfDoc } from "./pdf-doc";

function money(value?: string | null, fr = false): string {
  if (!value) return fr ? "montant à confirmer" : "amount to be confirmed";
  const n = Number(value).toFixed(0);
  return fr ? `${n} $ CA` : `$${n} CAD`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function kitFileName(claimId: string): string {
  return `kit_${claimId.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
}

/** The demand letter text alone (also shown on screen so the passenger can copy it into an airline web form). */
export function demandLetter(claim: Claim): { subject: string; body: string } {
  const fr = claim.language === "fr";
  const airline = getAirlineByFlightNumber(claim.flightNumber)?.name ?? (fr ? "la compagnie aérienne" : "the airline");
  const reasonLabel = claim.delayReason === "unknown" ? "" : delayReasons.find((r) => r.value === claim.delayReason)?.label ?? claim.delayReason ?? "";
  const denied = claim.issueType === "denied-boarding";
  const today = isoDate(new Date());
  const amount = money(claim.compensationAmount, fr);
  const section = denied ? "20" : "19";

  if (fr) {
    return {
      subject: `Demande d'indemnisation – RPPA – vol ${claim.flightNumber} du ${claim.flightDate}`,
      body: `${today}

À : ${airline}, Service des relations avec la clientèle

Objet : Demande d'indemnisation en vertu du Règlement sur la protection des passagers aériens (DORS/2019-150), article ${section}

Madame, Monsieur,

Je, ${claim.passengerName}, étais passager du vol ${claim.flightNumber} du ${claim.flightDate}, de ${claim.departureAirport} à ${claim.arrivalAirport}.
${denied ? `On m'a refusé l'embarquement et je suis arrivé à destination avec un retard de ${claim.delayDuration} heures.` : `Ce vol a été ${claim.issueType === "cancelled" ? "annulé" : "retardé"} et je suis arrivé à ma destination finale avec un retard de ${claim.delayDuration} heures.`}
${reasonLabel ? `La raison communiquée par la compagnie était : ${reasonLabel}.` : "Aucune raison ne m'a été communiquée, contrairement à l'article 13 du Règlement."}

Cette perturbation est attribuable au transporteur et n'était pas nécessaire par souci de sécurité. En vertu de l'article ${section} du Règlement, je demande le versement d'une indemnité de ${amount}, par virement ou chèque, et non sous forme de crédit-voyage.

Conformément à l'article ${denied ? "20" : "19(4)"} du Règlement, vous disposez de 30 jours pour répondre à la présente, soit pour verser l'indemnité, soit pour m'expliquer par écrit pourquoi elle ne serait pas due. À défaut, je porterai la réclamation devant l'Office des transports du Canada et/ou la Division des petites créances de la Cour du Québec, et je demanderai les frais.

Pièces jointes : carte d'embarquement, preuve du retard, correspondance.

Veuillez agréer mes salutations distinguées,

${claim.passengerName}
${claim.email}
Référence : ${claim.claimId}`,
    };
  }
  return {
    subject: `Compensation claim – APPR – flight ${claim.flightNumber} on ${claim.flightDate}`,
    body: `${today}

To: ${airline}, Customer Relations

Re: Claim for compensation under the Air Passenger Protection Regulations (SOR/2019-150), section ${section}

Dear Sir or Madam,

I, ${claim.passengerName}, was a passenger on flight ${claim.flightNumber} on ${claim.flightDate}, from ${claim.departureAirport} to ${claim.arrivalAirport}.
${denied ? `I was denied boarding and arrived at my destination ${claim.delayDuration} hours late.` : `The flight was ${claim.issueType === "cancelled" ? "cancelled" : "delayed"} and I arrived at my final destination ${claim.delayDuration} hours late.`}
${reasonLabel ? `The reason the airline gave was: ${reasonLabel}.` : "No reason was communicated to me, contrary to section 13 of the Regulations."}

This disruption was within the carrier's control and was not required for safety purposes. Under section ${section} of the Regulations I request payment of ${amount} in compensation, by bank transfer or cheque, not as a travel credit.

Under section ${denied ? "20" : "19(4)"} of the Regulations you have 30 days to respond to this request, either by paying the compensation or by explaining in writing why it is not owed. Failing that, I will bring this claim before the Canadian Transportation Agency and/or the Small Claims Division of the Court of Québec, and will seek costs.

Attachments: boarding pass, proof of delay, correspondence.

Sincerely,

${claim.passengerName}
${claim.email}
Reference: ${claim.claimId}`,
  };
}

export async function renderKitPdf(claim: Claim): Promise<Buffer> {
  const fr = claim.language === "fr";
  const doc = await PdfDoc.create();
  const airline = getAirlineByFlightNumber(claim.flightNumber);
  const reasonStatus = getReasonStatus(claim.delayReason);
  const letter = demandLetter(claim);
  const sentOn = claim.airlineContactedAt ? new Date(claim.airlineContactedAt) : null;
  const deadline = sentOn ? new Date(sentOn.getTime() + 30 * 86400000) : null;
  const filingLimit = new Date(`${claim.flightDate}T00:00:00Z`);
  filingLimit.setUTCFullYear(filingLimit.getUTCFullYear() + 1);

  // 1. Cover + eligibility
  doc.heading(fr ? "Trousse de réclamation" : "Self-serve claim kit");
  doc.text(`${BRAND_NAME} · ${DOMAIN} · ${SUPPORT_EMAIL}`, { size: 9, color: [0.3, 0.3, 0.3] });
  doc.keyValue([
    [fr ? "Référence" : "Reference", claim.claimId],
    [fr ? "Passager" : "Passenger", claim.passengerName],
    [fr ? "Vol" : "Flight", `${claim.flightNumber} · ${claim.flightDate} · ${claim.departureAirport} → ${claim.arrivalAirport}`],
    [fr ? "Compagnie" : "Airline", airline ? `${airline.name} (${airline.category === "large" ? (fr ? "grand transporteur" : "large carrier") : fr ? "petit transporteur" : "small carrier"})` : fr ? "à confirmer" : "to confirm"],
    [fr ? "Perturbation" : "Disruption", `${claim.issueType} · ${claim.delayDuration}h`],
    [fr ? "Indemnité RPPA estimée" : "Estimated APPR compensation", money(claim.compensationAmount, fr)],
  ]);
  doc.heading(fr ? "1. Votre admissibilité en bref" : "1. Your eligibility at a glance", 2);
  if (fr) {
    const carrier = airline ? `${airline.name} est un ${airline.category === "large" ? "grand" : "petit"} transporteur` : "Le transporteur n'a pas été reconnu (estimation basée sur un grand transporteur)";
    const band = claim.delayDuration ?? "?";
    doc.text(
      claim.issueType === "denied-boarding"
        ? `Refus d'embarquement avec un retard de ${band} h à l'arrivée : le RPPA prévoit ${money(claim.compensationAmount, true)} quel que soit le transporteur.`
        : claim.compensationAmount
          ? `${carrier}; un retard de ${band} h à l'arrivée, attribuable à la compagnie, donne droit à ${money(claim.compensationAmount, true)} en vertu du RPPA.`
          : `${carrier}. Selon la raison donnée, l'indemnisation n'est pas acquise : voir ci-dessous.`,
    );
  } else {
    doc.text(claim.eligibilityValidation?.reason ?? "");
  }
  if (reasonStatus === "inadmissible") {
    doc.text(
      fr
        ? "La raison donnée par la compagnie n'est normalement pas indemnisable. Les compagnies se trompent souvent de catégorie (ex. pénurie d'équipage présentée comme « sécurité »). Demandez-leur par écrit la preuve de la cause : l'article 13 du Règlement les oblige à vous donner la raison."
        : "The reason the airline gave is normally not compensable. Airlines often misclassify (e.g. crew shortage presented as \"safety\"). Ask them in writing for proof of the cause: section 13 of the Regulations obliges them to tell you the reason.",
    );
  } else if (reasonStatus === "unknown") {
    doc.text(fr ? "Vous ne connaissez pas la cause : la lettre ci-dessous la demande officiellement. La compagnie doit vous la donner." : "You do not know the cause: the letter below formally asks for it. The airline must tell you.");
  }

  // 2. Evidence checklist
  doc.heading(fr ? "2. Liste des preuves à rassembler" : "2. Evidence checklist", 2);
  doc.bullets(
    fr
      ? [
          "Carte d'embarquement (photo ou PDF) et confirmation de réservation",
          "Heure d'arrivée prévue et heure d'arrivée réelle (capture de l'application de la compagnie, FlightAware, ou courriel de retard)",
          "Tout message de la compagnie donnant la raison (courriel, SMS, annonce)",
          "Reçus : repas, hôtel, transport, si la compagnie ne les a pas fournis",
          "Noms d'autres passagers prêts à témoigner, si possible",
          "Un journal daté de ce qui s'est passé, écrit de votre main, pendant que c'est frais",
        ]
      : [
          "Boarding pass (photo or PDF) and booking confirmation",
          "Scheduled vs actual arrival time (screenshot of the airline app, FlightAware, or the delay email)",
          "Any message from the airline giving the reason (email, text, announcement)",
          "Receipts: meals, hotel, transport, if the airline did not provide them",
          "Names of other passengers willing to confirm the facts, if possible",
          "A dated note of what happened, in your own words, written while it is fresh",
        ],
    { checkbox: true },
  );

  // 3. Letter
  doc.newPage();
  doc.heading(fr ? "3. Lettre de mise en demeure (à envoyer à la compagnie)" : "3. Demand letter (send to the airline)", 2);
  doc.text(fr ? `Objet : ${letter.subject}` : `Subject: ${letter.subject}`, { bold: true });
  doc.text(letter.body, { size: 10 });
  doc.text(
    fr
      ? "Comment l'envoyer : par le formulaire de réclamation du site de la compagnie (gardez une capture d'écran de la confirmation) ET par courriel au service clientèle. Notez la date d'envoi : le délai de 30 jours commence ce jour-là."
      : "How to send it: through the airline's online claim form (keep a screenshot of the confirmation) AND by email to customer relations. Note the date you send it: the 30-day clock starts that day.",
    { size: 9.5, color: [0.25, 0.25, 0.25] },
  );

  // 4. Countdown
  doc.heading(fr ? "4. Le compte à rebours de 30 jours" : "4. The 30-day countdown", 2);
  doc.keyValue([
    [fr ? "Date limite pour réclamer" : "Deadline to claim", `${isoDate(filingLimit)} (${fr ? "1 an après le vol" : "1 year after the flight"})`],
    [fr ? "Lettre envoyée le" : "Letter sent on", sentOn ? isoDate(sentOn) : fr ? "à inscrire" : "fill in"],
    [fr ? "Réponse due le" : "Response due on", deadline ? isoDate(deadline) : fr ? "envoi + 30 jours" : "sent date + 30 days"],
  ]);
  doc.bullets(
    fr
      ? [
          "Jour 0 : envoyez la lettre et vos preuves. Sauvegardez tout dans votre dossier en ligne.",
          "Jour 14 : sans réponse, renvoyez la lettre en indiquant « deuxième envoi ».",
          "Jour 30 : la compagnie doit avoir payé ou expliqué par écrit. Sinon, passez à l'étape 5.",
          "Si elle refuse en invoquant la « sécurité » ou « hors de notre contrôle », demandez la preuve écrite de la cause avant d'accepter.",
        ]
      : [
          "Day 0: send the letter and your evidence. Save everything in your online file.",
          "Day 14: no answer? Send the letter again marked \"second request\".",
          "Day 30: the airline must have paid or explained in writing. If not, go to step 5.",
          "If it refuses citing \"safety\" or \"outside our control\", ask for written proof of the cause before accepting.",
        ],
    { numbered: true },
  );

  // 5. Next steps
  doc.heading(fr ? "5. Si la compagnie refuse ou ne répond pas" : "5. If the airline refuses or does not answer", 2);
  doc.text(fr ? "Option A – Office des transports du Canada (OTC)" : "Option A – Canadian Transportation Agency (CTA)", { bold: true });
  doc.text(
    fr
      ? "Gratuit, en ligne (rppa-appr.ca). L'OTC tranche les litiges mais l'attente dépasse souvent un an. Convient si vous ne souhaitez pas vous présenter devant un tribunal."
      : "Free, online (rppa-appr.ca). The CTA decides disputes but the wait often exceeds a year. Suitable if you do not want to appear anywhere.",
  );
  doc.text(fr ? "Option B – Division des petites créances, Cour du Québec" : "Option B – Small Claims Division, Court of Québec", { bold: true });
  doc.text(
    fr
      ? "Réclamations jusqu'à 15 000 $. Aucun avocat n'est admis; la médiation est gratuite; audience en quelques mois. Vous devez vous présenter vous-même. Nous pouvons préparer votre dossier complet (index des pièces, projet de demande, script d'audience)."
      : "Claims up to $15,000. No lawyers allowed; mediation is free; a hearing comes within months. You must attend yourself. We can prepare your complete file (exhibit index, draft statement of claim, hearing script).",
  );
  doc.text(
    fr
      ? `Vous pouvez aussi nous confier le dossier à tout moment : ${DOMAIN}/my-claims. Ce document est une aide à la démarche et ne constitue pas un avis juridique.`
      : `You can also hand the file to us at any time: ${DOMAIN}/my-claims. This document is practical guidance and not legal advice.`,
    { size: 9, color: [0.3, 0.3, 0.3] },
  );
  return doc.save();
}
