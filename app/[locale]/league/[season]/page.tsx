import { Locales } from "@/utils/types";
import { CoopLeagueSeasonPageClient } from "./Client";
import { notFound } from "next/navigation";
import { getSeasonName } from "../data";

export interface CoopLeagueSeasonPageParams {
  locale: Locales
  season: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params

  const seasonName = await getSeasonName(p.season)

  const metadata = {
    title: `GITCG Co-op League ${seasonName.data?.name || ""}`,
    description: "Pitabrain"
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueSeasonPage({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params

  const seasonName = await getSeasonName(p.season)
  
  if(!seasonName.data) notFound()
  
  return <CoopLeagueSeasonPageClient params={p}/>
}