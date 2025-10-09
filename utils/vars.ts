import { Server, Locales } from "./types";

export const duelistRecordUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhnG_G2rrvenTIgR-01LlcdkxgRasH5RJvEfF5Ivo7FLu95TsEaA-1BzVZaD_vXc6GoaFboTgijX5v/pub?gid=889607217&single=true&output=csv"

export const serverList: { value: Server, label: string }[] = [
  { value: "all", label: "All Servers" },
  { value: "na", label: "America" },
  { value: "eu", label: "Europe" },
  { value: "as", label: "Asia" }
] as const;

export const languages: { locale: Locales, name: string }[] =[
  { locale: "en", name: "English" },
  { locale: "id", name: "Indonesia" },
  { locale: "zh-cn", name: "简体中文" },
]

export const weeklyMatchdataHeader = {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true
}

export const prefixStatusRegEx = /^\[[^\]]+\]/