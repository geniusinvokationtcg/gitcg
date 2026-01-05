import { Locales } from "./types";

export function percentize(n: number | string, locale: string): string{
  if(typeof n === "string") n = parseFloat(n);
  return `${(n*100).toLocaleString(locale,{
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`
}

export function normalizeSearchText (text: string, locale: Locales): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}