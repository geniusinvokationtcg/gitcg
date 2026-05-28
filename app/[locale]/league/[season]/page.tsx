import { Locales } from "@/utils/types";
import { DeckBuilderPageClient } from "./Client";

export interface CoopLeagueSeasonPageParams {
  locale: Locales
  season: string
}

export async function generateMetadata({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params

  const metadata = {
    title: `GITCG Co-op League Season ${p.season}`,
    description: "The best league"
  }

  return { ...metadata, openGraph: metadata, twitter: metadata }
}

export default async function CoopLeagueSeasonPage({ params }: { params: Promise<CoopLeagueSeasonPageParams> }) {
  const p = await params
  return <DeckBuilderPageClient params={p}/>
}