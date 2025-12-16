import { getTableLabels, type Locale } from "@/lib/i18n/index";

export const DEFAULT_ITEMS_PER_PAGE = 100;

export function getLabels(locale: Locale = "es") {
  return getTableLabels(locale);
}

export const TABLE_LABELS = getTableLabels("es");

export const TABLE_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: "easeOut" },
};

export const TABLE_BULK_ANIMATION = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: "easeOut" },
};
