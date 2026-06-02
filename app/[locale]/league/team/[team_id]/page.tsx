import { Locales } from "@/utils/types"
import { CoopLeagueTeamPageClient } from "./Client"
import { supabase } from "@/lib/supabaseClient"
import { notFound } from "next/navigation"

export interface CoopLeagueTeamPageParams {
  locale: Locales
  team_id: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueTeamPageParams> }) {
  const p = await params

  const team = await supabase.schema("league")
    .from("teams")
    .select("season_id,name")
    .eq("id", p.team_id)
    .single()
  
  const seasonName = await supabase.schema("league")
    .from("seasons")
    .select("name")
    .eq("season_id", team.data?.season_id)
    .single<{ name: string }>()

  const metadata = {
    title: `${team.data?.name} | GITCG Co-op League ${seasonName.data?.name || ""}`,
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueTeamPage({ params }: { params: Promise<CoopLeagueTeamPageParams> }) {
  const p = await params

  const season = await supabase.schema("league")
    .from("teams")
    .select("season_id")
    .eq("id", p.team_id)
    .single<{ season_id: string }>()
  
  if(!season.data) notFound()

  return <CoopLeagueTeamPageClient params={p} season_id={season.data.season_id}/>
}