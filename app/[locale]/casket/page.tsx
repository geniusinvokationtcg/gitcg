import { getLocalCardsData } from "@/cards/localCardsData";
import { Locales } from "@/utils/types";
import { DeckBuilderPageClient } from "./Client";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export interface DeckBuilderPageParams {
  locale: Locales
}
export interface DeckBuilderPageSearchParams {
  q?: string //import deckcode
}

export async function generateMetadata (): Promise<Metadata> {
  const t = await getTranslations("DeckBuilderPage");

  const metadata = {
    title: t("title"),
    description: t("description")
  }

  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default async function DeckBuilderPage ({ params, searchParams }: { params: Promise<DeckBuilderPageParams>; searchParams: Promise<DeckBuilderPageSearchParams> }) {
  const p = await params;
  const q = await searchParams;
  
  return <DeckBuilderPageClient params={p} searchParams={q} />
}