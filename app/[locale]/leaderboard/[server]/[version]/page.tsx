import { Locales, Season, Server } from "@/utils/types";
import { Metadata } from "next";
import { LeaderboardPageClient } from "./Client";
import { getTranslations } from "next-intl/server";
import { serverList } from "@/utils/vars";
import { getVerLabel } from "@/utils/version";
import { seasons } from "../../seasons";

export interface LeaderboardPageParams {
  locale: Locales
  server: Server
  version: string
}

export async function generateMetadata ({ params }: { params: Promise<LeaderboardPageParams> }): Promise<Metadata> {
  const { locale, server, version } = await params
  const t = await getTranslations("LeaderboardPage")
  const s = await getTranslations("Server")
  
  let season: Season | null = null
  if(!(server === "all" || !serverList.some(s => s.value === server))) {
    season = seasons[server].find(se => se.versions.includes(version)) ?? null
  }

  const vars = {
    version: !season ? "" : season.versions.length === 1 ? getVerLabel(season.versions[0], locale) : t("season_with_multiple_versions_label", {
      first: getVerLabel(season.versions[0], locale),
      last: getVerLabel(season.versions.at(-1)!, locale)
    }),
    server: server !== "all" && serverList.some(s => s.value === server) ? s(server) : ""
  }
  const metadata = {
    title: t("title", vars),
    description: t("description", vars)
  }
  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default async function LeaderboardPage ({ params }: { params: Promise<LeaderboardPageParams> }) {
  const p = await params
  return <LeaderboardPageClient params={p}/>
}