import gameVersionImport from "@/game-version.json";
import { Locales } from "@/utils/types"

export const gameVersion = gameVersionImport

export function getVerLabel(version: string, locale: Locales) {
  type LocaleLabel = Partial<Record<Locales, string>> & {
    en: string;
  }
  type SpecialLabel = { version: string; label: LocaleLabel }

  const specialLabel: SpecialLabel | undefined = gameVersion.special_label.find(v => v.version === version);

  if(!specialLabel) return version.replace("-", ".");
  
  return specialLabel.label[locale] ?? specialLabel.label.en;
}