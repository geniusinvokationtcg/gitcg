import { Locales, Server } from "./types";
import { serverList } from "./vars";

export function getServerLabel(server: Server, locale: Locales = "en") {
  return serverList.find(s => s.value === server)?.label
}