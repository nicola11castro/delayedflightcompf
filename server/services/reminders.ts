/**
 * Daily reminders so no file is forgotten:
 * - team digest to ADMIN_EMAILS: airline deadlines passed, filing limits approaching
 * - kit passengers: a nudge when their own 30 days have passed
 */
import { storage } from "../storage";
import { emailService } from "./email";
import { sendStageEmail } from "./claim-emails";
import { adminEmails } from "../auth";
import { appUrl } from "../config";
import { BRAND_NAME } from "@shared/brand";

const DAY = 24 * 60 * 60 * 1000;

export async function runReminders(now = new Date()): Promise<{ overdue: number; nearLimit: number; kitNudged: number }> {
  const overdue = (await storage.getClaimsWithOverdueAirlineDeadline(now)).filter(
    (claim) => !claim.teamReminderAt || now.getTime() - new Date(claim.teamReminderAt).getTime() > 7 * DAY,
  );
  const nearLimit = (await storage.getClaimsNearFilingLimit(now, new Date(now.getTime() + 60 * DAY))).filter(
    (claim) => !claim.teamReminderAt || now.getTime() - new Date(claim.teamReminderAt).getTime() > 7 * DAY,
  );

  if (overdue.length || nearLimit.length) {
    const lines: string[] = [];
    if (overdue.length) {
      lines.push(`Airline deadline passed, not yet escalated (${overdue.length}):`);
      for (const c of overdue) lines.push(`  - ${c.claimId} ${c.passengerName} ${c.flightNumber} ${c.flightDate} · deadline ${new Date(c.airlineDeadlineAt!).toISOString().slice(0, 10)} · ${appUrl()}/admin/claims/${c.id}`);
    }
    if (nearLimit.length) {
      lines.push(`Not yet sent to the airline, one-year filing limit within 60 days (${nearLimit.length}):`);
      for (const c of nearLimit) lines.push(`  - ${c.claimId} ${c.passengerName} ${c.flightNumber} ${c.flightDate} · ${appUrl()}/admin/claims/${c.id}`);
    }
    const text = `${BRAND_NAME} daily reminders – ${now.toISOString().slice(0, 10)}\n\n${lines.join("\n")}`;
    for (const to of adminEmails()) {
      try {
        const sent = await emailService.sendMail({ to, subject: `[${BRAND_NAME}] ${overdue.length} overdue, ${nearLimit.length} near filing limit`, text, html: `<pre style="font-family:monospace">${text.replace(/</g, "&lt;")}</pre>` });
        if (!sent) console.log(`[reminders] digest for ${to}:\n${text}`);
      } catch (error) {
        console.error("[reminders] digest failed:", error);
      }
    }
    for (const c of [...overdue, ...nearLimit]) {
      await storage.updateClaim(c.id, { teamReminderAt: now });
      await storage.addClaimEvent({ claimId: c.id, type: "system", message: overdue.includes(c) ? "Reminder sent to the team: airline deadline passed, escalation pending" : "Reminder sent to the team: one-year filing limit approaching" });
    }
  }

  // Kit passengers: their 30 days passed and we have not nudged them yet.
  let kitNudged = 0;
  for (const claim of await storage.getClaimsWithOverdueAirlineDeadline(now)) {
    if (claim.serviceLevel !== "kit" || claim.kitDeadlineReminderAt) continue;
    await sendStageEmail(claim, "kit_deadline_passed");
    await storage.updateClaim(claim.id, { kitDeadlineReminderAt: now });
    kitNudged += 1;
  }

  return { overdue: overdue.length, nearLimit: nearLimit.length, kitNudged };
}

/** Run once shortly after boot, then every 24 hours. Disabled with REMINDERS=false. */
export function scheduleReminders() {
  if (process.env.REMINDERS === "false") return;
  const run = () => runReminders().then((r) => console.log(`[reminders] overdue=${r.overdue} nearLimit=${r.nearLimit} kitNudged=${r.kitNudged}`)).catch((e) => console.error("[reminders] failed:", e));
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, DAY).unref();
}
