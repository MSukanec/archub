import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { es, type TranslationKeys } from "./translations/es";
import { en } from "./translations/en";
export type Locale = "es" | "en";
const translations: Record<Locale, TranslationKeys> = {
  es,
  en,
};
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}
const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "seencel-locale";
const DEFAULT_LOCALE: Locale = "es";
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "es" || stored === "en") return stored;
  
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "en") return "en";
  
  return DEFAULT_LOCALE;
}
interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}
export function I18nProvider({ children, defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => defaultLocale ?? getInitialLocale());
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translations[locale],
    }),
    [locale, setLocale]
  );
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: translations[DEFAULT_LOCALE],
    };
  }
  return context;
}
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
export function getTableLabels(locale: Locale = DEFAULT_LOCALE) {
  return translations[locale].table;
}
export { es, en };
export type { TranslationKeys };
