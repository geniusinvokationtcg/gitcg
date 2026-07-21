import { Locales } from "@/utils/types"
import { supabase } from "@/lib/supabaseClient"
import { notFound } from "next/navigation"
import { LeagueMatch } from "../../types"
import { CoopLeagueMatchPageClient } from "./Client"
import { unstable_cache } from "next/cache"
import { revalidate } from "@/app/[locale]/weekly/[version]/[server]/[week]/decks/page"
import { getMatch, getSeasonName, getTeams } from "../../data"

export interface CoopLeagueMatchPageParams {
  locale: Locales
  match_id: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueMatchPageParams> }) {
  const p = await params

  const match = await getMatch(p.match_id)

  if(!match.data) notFound();
  
  const teams = await getTeams([match.data.team_a_id, match.data.team_b_id])

  const seasonName = await getSeasonName(match.data.season_id)

  const metadata = {
    title: `${teams.data && `${teams.data[0].alias} vs ${teams.data[1].alias} | `}GITCG Co-Op League ${seasonName.data?.name || ""} Week ${match.data?.week || ""}`,
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueMatchPage({ params }: { params: Promise<CoopLeagueMatchPageParams> }) {
  const p = await params

  const match = await getMatch(p.match_id)
  
  if(!match.data) return "Error loading team: "+match.error.message
  
  const teams = await getTeams([match.data.team_a_id, match.data.team_b_id])

  if(!teams.data) return "Error loading team: "+teams.error.message

  return <CoopLeagueMatchPageClient params={p} season_id={match.data.season_id} match={match.data} teams={teams.data}/>
}

