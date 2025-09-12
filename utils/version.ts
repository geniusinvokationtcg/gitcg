import gameVersionImport from "@/game-version.json";
import { Locales } from "@/utils/types"

export const gameVersion = gameVersionImport

export function getVerLabel(version: string, locale: Locales) {
  const specialLabel = gameVersion.special_label.find(v => v.version === version)
  if(!specialLabel) return version.replace("-", ".")
  return specialLabel.label[locale] ?? specialLabel.label.en
}