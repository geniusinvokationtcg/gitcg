import { notFound, redirect } from "next/navigation"
import { seasons } from "./seasons"
import { ServerPure } from "@/utils/types"

export default async function LeaderboardRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  let server: ServerPure = "na"
  let season = seasons[server].find(s => !s.is_hidden && s.versions.length > 0)
  if(!season) {
    server = "eu"
    season = seasons[server].find(s => !s.is_hidden && s.versions.length > 0)
  }
  if(!season) {
    server = "as"
    season = seasons[server].find(s => !s.is_hidden && s.versions.length > 0)
  }
  
  if(!season) notFound();
  
  redirect(`/${locale}/leaderboard/${server}/${season.versions.at(-1)}`)
}