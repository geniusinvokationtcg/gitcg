import { serverList } from "@/utils/vars";
import { useTranslations } from "next-intl";

export function useTranslatedServers() {
  const t = useTranslations("Server");
  return serverList.map(server => ({
    value: server.value,
    label: server.value === "all" ? t(server.value) : server.label
  }))
}