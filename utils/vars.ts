import { Server, Locales } from "./types";

export const duelistRecordUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhnG_G2rrvenTIgR-01LlcdkxgRasH5RJvEfF5Ivo7FLu95TsEaA-1BzVZaD_vXc6GoaFboTgijX5v/pub?gid=889607217&single=true&output=csv"

export const serverList: { value: Server, label: string }[] = [
  { value: "all", label: "All Servers" },
  { value: "na", label: "America" },
  { value: "eu", label: "Europe" },
  { value: "as", label: "Asia" }
] as const;

export const servers = ["na", "eu", "as"]

export const languages: { locale: Locales, name: string }[] =[
  { locale: "en", name: "English" },
  { locale: "id", name: "Indonesia" },
  { locale: "vi", name: "Tiếng Việt" },
  { locale: "zh-cn", name: "简体中文" },
]

export const weeklyMatchdataHeader = {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true
}

export const prefixStatusRegEx = /^\[[^\]]+\]/

export const costIconUrls = {
  aligned: "https://webstatic.hoyoverse.com/upload/static-resource/2023/01/17/3367995a8344bccc77b2d9f794c1bbd2_3133187640885784967.png"
}

export const gameCosts = [
  { name: "energy", type: "1" }
]