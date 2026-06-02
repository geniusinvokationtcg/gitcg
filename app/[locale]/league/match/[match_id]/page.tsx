import { Locales } from "@/utils/types"
import { supabase } from "@/lib/supabaseClient"
import { notFound } from "next/navigation"
import { LeagueMatch } from "../../types"
import { CoopLeagueMatchPageClient } from "./Client"

export interface CoopLeagueMatchPageParams {
  locale: Locales
  match_id: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueMatchPageParams> }) {
  const p = await params

  const match = await supabase.schema("league")
    .from("matches")
    .select("*")
    .eq("id", p.match_id)
    .single<LeagueMatch>()
  
  const teams = await supabase.schema("league")
    .from("teams")
    .select("id,alias")
    .in("id", [match.data?.team_a_id, match.data?.team_b_id])

  const seasonName = await supabase.schema("league")
    .from("seasons")
    .select("name")
    .eq("season_id", match.data?.season_id)
    .single<{ name: string }>()

  const metadata = {
    title: `${teams.data && `${teams.data[0].alias} vs ${teams.data[1].alias} | `}GITCG Co-Op League ${seasonName.data?.name || ""} Week ${match.data?.week || ""}`,
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueMatchPage({ params }: { params: Promise<CoopLeagueMatchPageParams> }) {
  const p = await params

  const match = await supabase.schema("league")
    .from("matches")
    .select("*")
    .eq("id", p.match_id)
    .single<LeagueMatch>()
  
  if(!match.data) notFound();
  
  const teams = await supabase.schema("league")
    .from("teams")
    .select("*")
    .in("id", [match.data.team_a_id, match.data.team_b_id])

  if(!teams.data) notFound()

  return <CoopLeagueMatchPageClient params={p} season_id={match.data.season_id} match={match.data} teams={teams.data}/>
}