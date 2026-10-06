/**
 * Built-in Power of Attorney: the passenger signs on screen, we render a PDF
 * with pdf-lib (no external e-signature service), store it and attach it.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { Claim } from "@shared/schema";
import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";

export const POA_VERSION = "1.0";

export function poaFileName(claimId: string): string {
  return `poa_${claimId.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
}

function decodeSignature(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) throw new Error("Signature must be a PNG data URL");
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length < 100 || buffer.length > 2 * 1024 * 1024) throw new Error("Signature image has an invalid size");
  return buffer;
}

export async function renderPoaPdf(
  claim: Claim,
  signature: { dataUrl: string; typedName: string; signedAt: Date; ipAddress?: string; userAgent?: string },
): Promise<Buffer> {
  const fr = claim.language === "fr";
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 56;
  let y = 792 - margin;

  const draw = (text: string, options: { size?: number; font?: typeof font; gap?: number } = {}) => {
    const size = options.size ?? 10.5;
    const f = options.font ?? font;
    const maxWidth = 612 - margin * 2;
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    for (const l of lines) {
      page.drawText(l, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size * 1.45;
    }
    y -= options.gap ?? 4;
  };

  const compensation = claim.compensationAmount ? Number(claim.compensationAmount) : 0;
  const commission = claim.commissionAmount ? Number(claim.commissionAmount) : Math.round(compensation * 0.15);
  const net = compensation - commission;
  const money = (v: number) => (fr ? `${v.toFixed(0)} $ CA` : `$${v.toFixed(0)} CAD`);

  draw(fr ? "PROCURATION" : "POWER OF ATTORNEY", { size: 18, font: bold, gap: 2 });
  draw(fr ? `Autorisation de réclamation d'indemnisation de vol – ${BRAND_NAME}` : `Flight compensation claim authorization – ${BRAND_NAME}`, { size: 11, gap: 10 });

  draw(`${fr ? "Numéro de réclamation" : "Claim ID"}: ${claim.claimId}`, { font: bold });
  draw(`${fr ? "Passager" : "Passenger"}: ${claim.passengerName}  |  ${fr ? "Courriel" : "Email"}: ${claim.email}`);
  draw(`${fr ? "Vol" : "Flight"}: ${claim.flightNumber}  |  ${fr ? "Date" : "Date"}: ${claim.flightDate}  |  ${claim.departureAirport} -> ${claim.arrivalAirport}`, { gap: 10 });

  draw(fr ? "1. Portée" : "1. Scope", { font: bold });
  draw(
    fr
      ? `Je, ${claim.passengerName}, autorise ${BRAND_NAME} à agir en mon nom pour toute réclamation d'indemnisation relative à la perturbation du vol ci-dessus en vertu du Règlement sur la protection des passagers aériens (RPPA), de la Convention de Montréal ou de toute autre règle applicable : soumettre la réclamation, correspondre et négocier avec la compagnie aérienne, déposer une plainte auprès de l'Office des transports du Canada et percevoir l'indemnisation.`
      : `I, ${claim.passengerName}, authorize ${BRAND_NAME} to act on my behalf for any compensation claim relating to the flight disruption above under the Air Passenger Protection Regulations (APPR), the Montreal Convention or any other applicable rule: to submit the claim, correspond and negotiate with the airline, file a complaint with the Canadian Transportation Agency, and collect the compensation.`,
  );
  draw(fr ? "2. Commission" : "2. Commission", { font: bold });
  draw(
    fr
      ? `${BRAND_NAME} prélève une commission de 15 % uniquement sur l'indemnisation effectivement obtenue (estimation : indemnisation ${money(compensation)}, commission ${money(commission)}, montant qui me revient ${money(net)}). Aucuns frais ne sont dus si la réclamation échoue. Si la compagnie me paie directement, je m'engage à régler la commission dans les 14 jours suivant la facture.`
      : `${BRAND_NAME} charges a 15% commission only on compensation actually recovered (estimate: compensation ${money(compensation)}, commission ${money(commission)}, amount due to me ${money(net)}). No fee is owed if the claim is unsuccessful. If the airline pays me directly, I agree to pay the commission within 14 days of the invoice.`,
  );
  draw(fr ? "3. Durée et révocation" : "3. Duration and revocation", { font: bold });
  draw(
    fr
      ? `Cette procuration demeure en vigueur jusqu'au règlement de la réclamation. Je peux la révoquer en tout temps par écrit à ${SUPPORT_EMAIL} avec un préavis de 7 jours; la commission reste due sur toute indemnisation obtenue grâce au travail déjà accompli.`
      : `This authorization remains in force until the claim is resolved. I may revoke it at any time in writing to ${SUPPORT_EMAIL} with 7 days notice; the commission remains payable on any compensation obtained through work already done.`,
  );
  draw(fr ? "4. Droit applicable" : "4. Governing law", { font: bold });
  draw(
    fr
      ? `La présente est régie par les lois du Québec et du Canada, y compris le Code civil du Québec et la Loi sur la protection du consommateur. Ma signature électronique a la même valeur qu'une signature manuscrite (Loi concernant le cadre juridique des technologies de l'information).`
      : `This document is governed by the laws of Québec and Canada, including the Civil Code of Québec and the Consumer Protection Act. My electronic signature has the same effect as a handwritten one (Act to establish a legal framework for information technology).`,
    { gap: 12 },
  );

  const png = await pdf.embedPng(decodeSignature(signature.dataUrl));
  const sigWidth = 220;
  const sigHeight = (png.height / png.width) * sigWidth;
  page.drawText(fr ? "Signature du passager :" : "Passenger signature:", { x: margin, y, size: 10.5, font: bold });
  y -= sigHeight + 8;
  page.drawImage(png, { x: margin, y, width: sigWidth, height: sigHeight });
  page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + sigWidth, y: y - 4 }, thickness: 0.8, color: rgb(0, 0, 0) });
  y -= 20;
  draw(`${signature.typedName}`, { font: bold, gap: 0 });
  draw(`${fr ? "Signé le" : "Signed on"} ${signature.signedAt.toISOString()}`, { size: 9, gap: 0 });
  draw(`${fr ? "Adresse IP" : "IP address"}: ${signature.ipAddress ?? "n/a"}  |  ${fr ? "Appareil" : "Device"}: ${(signature.userAgent ?? "n/a").slice(0, 80)}`, { size: 8, gap: 0 });
  draw(`${fr ? "Version du document" : "Document version"}: ${POA_VERSION}`, { size: 8 });

  return Buffer.from(await pdf.save());
}

export async function storePoaPdf(uploadsDir: string, claimId: string, pdf: Buffer): Promise<string> {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const filename = poaFileName(claimId);
  await fs.promises.writeFile(path.join(uploadsDir, filename), pdf);
  return filename;
}
