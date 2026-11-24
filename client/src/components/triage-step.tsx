import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLang } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";
import type { TriageAnswers } from "@shared/triage";

interface TriageStepProps {
  value: TriageAnswers;
  onChange: (next: TriageAnswers) => void;
  issueType: string;
}

/** The APPR eligibility questions, as radio groups in the Win98 style. */
export function TriageStep({ value, onChange, issueType }: TriageStepProps) {
  const { t } = useLang();
  const set = <K extends keyof TriageAnswers>(key: K, v: TriageAnswers[K]) => onChange({ ...value, [key]: v });
  const denied = issueType === "denied-boarding";

  const radio = <K extends keyof TriageAnswers>(key: K, options: string[]) => (
    <fieldset className="space-y-1">
      <legend className="text-sm font-bold mb-1">{t(`triage.${key}` as TranslationKey)}</legend>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name={key} value={opt} checked={value[key] === opt} onChange={() => set(key, opt as TriageAnswers[K])} />
          {t(`triage.${key}.${opt}` as TranslationKey)}
        </label>
      ))}
    </fieldset>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-lg">{t("triage.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("triage.lead")}</p>
      </div>

      {radio("ticketType", ["paid", "points", "free_staff"])}
      {radio("noticeTiming", ["at_airport", "under_14_days", "over_14_days", "not_told"])}
      {!denied && radio("outcome", ["rebooked_same", "rebooked_other", "refund", "still_travelled_late"])}
      {denied && radio("deniedVoluntary", ["involuntary", "volunteered"])}
      {denied && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-bold mb-1">{t("triage.presentedOnTime")}</legend>
          {[true, false].map((v) => (
            <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="presentedOnTime" checked={value.presentedOnTime === v} onChange={() => set("presentedOnTime", v)} />
              {v ? t("triage.yes") : t("triage.no")}
            </label>
          ))}
        </fieldset>
      )}
      {radio("reasonSource", ["written", "verbal", "not_told"])}
      {radio("priorClaim", ["none", "waiting", "denied", "paid"])}
      {value.priorClaim === "denied" && (
        <div>
          <label className="text-sm font-bold block mb-1">{t("triage.priorDenialReason")}</label>
          <Input value={value.priorDenialReason ?? ""} onChange={(e) => set("priorDenialReason", e.target.value)} className="win98-input" maxLength={500} />
        </div>
      )}
      {radio("settlement", ["none", "voucher", "cash"])}

      <div>
        <label className="text-sm font-bold block mb-1">{t("triage.partySize")}</label>
        <Input type="number" min={1} max={9} value={value.partySize} onChange={(e) => set("partySize", Math.max(1, Math.min(9, Number(e.target.value) || 1)))} className="win98-input w-24" />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-bold mb-1">{t("triage.evidence")}</legend>
        {(["hasBoardingPass", "hasWrittenReason", "hasArrivalProof"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={value[key]} onCheckedChange={(v) => set(key, v === true)} />
            {t(`triage.${key}` as TranslationKey)}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
