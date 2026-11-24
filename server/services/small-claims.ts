/**
 * Québec small-claims file: exhibit index, draft statement of claim and a
 * hearing script, generated from the claim and its timeline. Practical
 * guidance for the passenger, who must appear in person; not legal advice.
 */
import type { Claim, ClaimEvent } from "@shared/schema";
import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";
import { delayReasons, getAirlineByFlightNumber } from "@shared/appr";
import { PdfDoc } from "./pdf-doc";

export function smallClaimsFileName(claimId: string): string {
  return `petites_creances_${claimId.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
}

export async function renderSmallClaimsPdf(claim: Claim, events: ClaimEvent[]): Promise<Buffer> {
  const fr = claim.language === "fr";
  const doc = await PdfDoc.create();
  const airline = getAirlineByFlightNumber(claim.flightNumber)?.name ?? claim.flightNumber.slice(0, 2);
  const reasonLabel = claim.delayReason === "unknown" ? "" : delayReasons.find((r) => r.value === claim.delayReason)?.label ?? claim.delayReason ?? "";
  const amount = claim.compensationAmount ? Number(claim.compensationAmount) : 0;
  const denied = claim.issueType === "denied-boarding";
  const section = denied ? "20" : "19";
  const docs = claim.documentsUrls ?? [];
  const letterEvent = events.find((e) => e.type === "letter");
  const refusal = claim.airlineRefusedAt ? new Date(claim.airlineRefusedAt).toISOString().slice(0, 10) : null;

  doc.heading(fr ? "Dossier – Division des petites créances" : "File – Small Claims Division (Québec)");
  doc.text(`${BRAND_NAME} · ${fr ? "Préparé pour" : "Prepared for"} ${claim.passengerName} · ${claim.claimId}`, { size: 9, color: [0.3, 0.3, 0.3] });
  doc.text(
    fr
      ? "Ce dossier vous aide à déposer et présenter vous-même votre demande à la Cour du Québec (petites créances, maximum 15 000 $). Les avocats n'y plaident pas. Vérifiez les formulaires officiels sur justice.gouv.qc.ca; les frais de dépôt dépendent du montant réclamé."
      : "This file helps you file and present your own claim at the Court of Québec (small claims, maximum $15,000). Lawyers do not plead there. Check the official forms at justice.gouv.qc.ca; filing fees depend on the amount claimed.",
    { size: 9.5 },
  );

  // Exhibit index
  doc.heading(fr ? "A. Index des pièces" : "A. Exhibit index", 2);
  const exhibits: string[] = [
    fr ? "P-1 Carte d'embarquement et confirmation de réservation" : "P-1 Boarding pass and booking confirmation",
    fr ? "P-2 Preuve du retard à l'arrivée (données de vol, application, courriel de la compagnie)" : "P-2 Proof of arrival delay (flight data, app screenshot, airline email)",
    fr ? "P-3 Lettre de mise en demeure envoyée à la compagnie et preuve d'envoi" : "P-3 Demand letter sent to the airline and proof of sending",
    fr ? "P-4 Réponse (ou absence de réponse) de la compagnie" : "P-4 Airline's response (or lack of one)",
    fr ? "P-5 Reçus des dépenses, le cas échéant" : "P-5 Expense receipts, if any",
  ];
  if (claim.flightData) exhibits.push(fr ? `P-6 Relevé de données de vol (${claim.flightData.provider}) : retard de ${claim.flightData.delayMinutes ?? "?"} minutes` : `P-6 Flight data record (${claim.flightData.provider}): ${claim.flightData.delayMinutes ?? "?"} minutes late`);
  if (claim.poaSigned) exhibits.push(fr ? "P-7 Mandat signé (si vous êtes accompagné)" : "P-7 Signed mandate (if you are assisted)");
  doc.bullets(exhibits, { checkbox: true });
  if (docs.length) doc.text(fr ? `${docs.length} document(s) déjà téléversé(s) dans votre dossier en ligne.` : `${docs.length} document(s) already uploaded to your online file.`, { size: 9 });

  // Statement of claim
  doc.newPage();
  doc.heading(fr ? "B. Projet de demande (faits et conclusions)" : "B. Draft statement of claim (facts and conclusions)", 2);
  doc.keyValue([
    [fr ? "Demandeur" : "Plaintiff", `${claim.passengerName}, ${claim.email}`],
    [fr ? "Défenderesse" : "Defendant", `${airline} (${fr ? "siège social ou établissement au Québec" : "head office or establishment in Québec"})`],
    [fr ? "Montant réclamé" : "Amount claimed", amount ? `${amount.toFixed(0)} $` : fr ? "à préciser" : "to specify"],
  ]);
  const facts = [
    fr
      ? `Le ${claim.flightDate}, le demandeur était passager du vol ${claim.flightNumber} de la défenderesse, de ${claim.departureAirport} à ${claim.arrivalAirport} (P-1).`
      : `On ${claim.flightDate}, the plaintiff was a passenger on the defendant's flight ${claim.flightNumber} from ${claim.departureAirport} to ${claim.arrivalAirport} (P-1).`,
    denied
      ? fr
        ? `La défenderesse a refusé l'embarquement au demandeur, qui est arrivé à destination avec un retard de ${claim.delayDuration} heures (P-2).`
        : `The defendant denied the plaintiff boarding; the plaintiff arrived at destination ${claim.delayDuration} hours late (P-2).`
      : fr
        ? `Le vol a été ${claim.issueType === "cancelled" ? "annulé" : "retardé"}; le demandeur est arrivé à sa destination finale avec un retard de ${claim.delayDuration} heures (P-2).`
        : `The flight was ${claim.issueType === "cancelled" ? "cancelled" : "delayed"}; the plaintiff arrived at the final destination ${claim.delayDuration} hours late (P-2).`,
    reasonLabel
      ? fr
        ? `La raison invoquée par la défenderesse est : ${reasonLabel}. Cette cause est attribuable au transporteur et n'était pas nécessaire par souci de sécurité au sens du Règlement sur la protection des passagers aériens (DORS/2019-150).`
        : `The reason given by the defendant is: ${reasonLabel}. This cause is within the carrier's control and was not required for safety within the meaning of the Air Passenger Protection Regulations (SOR/2019-150).`
      : fr
        ? "La défenderesse n'a pas communiqué la raison de la perturbation, contrairement à l'article 13 du Règlement; il lui appartient de prouver une cause exonératoire."
        : "The defendant did not communicate the reason for the disruption, contrary to section 13 of the Regulations; it bears the burden of proving an exempting cause.",
    letterEvent
      ? fr
        ? `Le ${letterEvent.createdAt.toISOString().slice(0, 10)}, le demandeur a mis la défenderesse en demeure de verser l'indemnité prévue à l'article ${section} (P-3).`
        : `On ${letterEvent.createdAt.toISOString().slice(0, 10)}, the plaintiff formally demanded the compensation provided by section ${section} (P-3).`
      : fr
        ? `Le demandeur a mis la défenderesse en demeure de verser l'indemnité prévue à l'article ${section} (P-3).`
        : `The plaintiff formally demanded the compensation provided by section ${section} (P-3).`,
    refusal
      ? fr
        ? `Le ${refusal}, la défenderesse a refusé de payer (P-4).`
        : `On ${refusal}, the defendant refused to pay (P-4).`
      : fr
        ? "La défenderesse n'a pas payé dans le délai de 30 jours prévu au Règlement (P-4)."
        : "The defendant did not pay within the 30 days provided by the Regulations (P-4).",
    fr
      ? `En conséquence, le demandeur réclame ${amount ? amount.toFixed(0) + " $" : "l'indemnité prévue"} en vertu de l'article ${section} du Règlement, plus les intérêts, l'indemnité additionnelle (art. 1619 C.c.Q.) et les frais de justice.`
      : `Accordingly, the plaintiff claims ${amount ? "$" + amount.toFixed(0) : "the prescribed compensation"} under section ${section} of the Regulations, plus interest, the additional indemnity (art. 1619 C.C.Q.) and court costs.`,
  ];
  doc.bullets(facts, { numbered: true });
  doc.text(
    fr
      ? "Fondement juridique : Règlement sur la protection des passagers aériens, art. 13, 19 et 20; Loi sur les transports au Canada, art. 86.11; Convention de Montréal (art. 19) pour les vols internationaux; Code civil du Québec, art. 1458 et 1619."
      : "Legal basis: Air Passenger Protection Regulations, ss. 13, 19 and 20; Canada Transportation Act, s. 86.11; Montreal Convention (art. 19) for international flights; Civil Code of Québec, arts. 1458 and 1619.",
    { size: 9.5 },
  );

  // Hearing script
  doc.newPage();
  doc.heading(fr ? "C. Votre script d'audience (2 minutes)" : "C. Your hearing script (2 minutes)", 2);
  doc.text(
    fr
      ? "Le juge veut trois choses : les faits dans l'ordre, la preuve pour chacun, et le montant. Parlez lentement, montrez la pièce quand vous la citez."
      : "The judge wants three things: the facts in order, the evidence for each, and the amount. Speak slowly, hold up the exhibit when you cite it.",
  );
  doc.bullets(
    fr
      ? [
          `« Bonjour. Je suis ${claim.passengerName}. Le ${claim.flightDate}, j'étais sur le vol ${claim.flightNumber} de ${airline}. » (montrez P-1)`,
          `« Je suis arrivé ${claim.delayDuration} heures en retard. » (montrez P-2)`,
          reasonLabel ? `« La compagnie a dit : ${reasonLabel}. Le Règlement dit que c'est au transporteur de prouver qu'il n'était pas responsable. »` : "« La compagnie ne m'a jamais dit la raison, ce que le Règlement l'oblige à faire (article 13). »",
          "« J'ai envoyé une mise en demeure. » (montrez P-3) « Voici sa réponse. » (montrez P-4)",
          `« Je demande ${amount ? amount.toFixed(0) + " $" : "l'indemnité prévue"}, comme le prévoit l'article ${section} du Règlement, plus les intérêts et les frais. Merci. »`,
          "Si la compagnie parle de « sécurité » : demandez quel document le prouve et quand il a été produit. Sans preuve écrite, la présomption joue en votre faveur.",
        ]
      : [
          `"Good morning. I am ${claim.passengerName}. On ${claim.flightDate} I was on ${airline} flight ${claim.flightNumber}." (show P-1)`,
          `"I arrived ${claim.delayDuration} hours late." (show P-2)`,
          reasonLabel ? `"The airline said: ${reasonLabel}. The Regulations put the burden on the carrier to prove it was not responsible."` : "\"The airline never told me the reason, which the Regulations require (section 13).\"",
          '"I sent a formal demand." (show P-3) "Here is their answer." (show P-4)',
          `"I ask for ${amount ? "$" + amount.toFixed(0) : "the prescribed compensation"} as provided by section ${section} of the Regulations, plus interest and costs. Thank you."`,
          "If the airline mentions \"safety\": ask which document proves it and when it was produced. Without written proof, the presumption works in your favour.",
        ],
    { numbered: true },
  );
  doc.rule();
  doc.text(fr ? `Questions : ${SUPPORT_EMAIL}. Ce document est une aide pratique et ne constitue pas un avis juridique.` : `Questions: ${SUPPORT_EMAIL}. This document is practical guidance and not legal advice.`, { size: 9, color: [0.3, 0.3, 0.3] });
  return doc.save();
}
