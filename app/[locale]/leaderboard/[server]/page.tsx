import { useTranslatedServers } from "@/hooks/useTranslatedServers"
import { Server } from "@/utils/types"
import { notFound, redirect } from "next/navigation"
import { seasons } from "../seasons"
import { use } from "react"

export default function LeaderboardServerRedirectPage ({ params }: { params: Promise<{ locale: string, server: Server }> }) {
  const { locale, server } = use(params)

  const serverList = useTranslatedServers()
  if(server === "all" || !serverList.some(s => s.value === server)) notFound();

  const season = seasons[server].find(s => !s.is_hidden && s.versions.length > 0)
  if(!season) notFound();

  redirect(`/${locale}/leaderboard/${server}/${season.versions.at(-1)}`)
}