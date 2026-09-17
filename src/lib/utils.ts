import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLargeNumber(num: number): string {
  if (num >= 10000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num).toLowerCase();
  }
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Returns "ur" if text contains Arabic or Urdu Unicode characters,
 * or undefined so the element inherits the document's default "en" language.
 */
export function getLangAttr(text?: string | null): "ur" | undefined {
  if (!text) return undefined;
  // Arabic, Arabic Supplement, Arabic Extended-A, Arabic Presentation Forms A & B
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
    ? "ur"
    : undefined;
}
