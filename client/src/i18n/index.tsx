import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type TranslationKey } from "./en";
import { fr } from "./fr";

export type Language = "en" | "fr";

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, fr };
const STORAGE_KEY = "lang";

function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function translate(lang: Language, key: TranslationKey, vars?: Record<string, string | number>): string {
  let text = dictionaries[lang][key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage unavailable
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLang must be used within a LanguageProvider");
  return context;
}

/** Translate a dynamic value such as a delay reason or status, falling back to the raw value. */
export function useDynamicT() {
  const { t } = useLang();
  return (prefix: string, value: string | null | undefined, fallback?: string) => {
    if (!value) return fallback ?? "";
    const key = `${prefix}.${value}` as TranslationKey;
    return key in en ? t(key) : fallback ?? value;
  };
}
