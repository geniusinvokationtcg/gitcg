import { Locales } from "@/utils/types";
import { CoopLeagueSeasonPageClient } from "./Client";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

export interface CoopLeagueSeasonPageParams {
  locale: Locales
  season: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params

  const seasonName = await supabase.schema("league")
    .from("seasons")
    .select("name")
    .eq("season_id", p.season)
    .single<{ name: string }>()

  const metadata = {
    title: `GITCG Co-op League ${seasonName.data ? "Season "+seasonName.data.name : "" }`,
    description: "Pitabrain"
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueSeasonPage({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params

  const seasonName = await supabase.schema("league")
    .from("seasons")
    .select("name")
    .eq("season_id", p.season)
    .single<{ name: string }>()
  
  if(!seasonName.data) notFound()
  
  return <CoopLeagueSeasonPageClient params={p}/>
}