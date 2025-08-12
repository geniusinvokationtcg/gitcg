import { Server, Locales } from "./types";

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