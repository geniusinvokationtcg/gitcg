import { getLocalCardsData } from "@/cards/localCardsData";
import { Locales } from "@/utils/types";
import { DeckBuilderPageClient } from "./Client";

export interface DeckBuilderPageParams {
  locale: Locales
}

export default async function DeckBuilderPage ({ params }: { params: Promise<DeckBuilderPageParams> }) {
  const p = await params;
  const { locale } = p;

  let localCardsData = await getLocalCardsData(locale);

  return <DeckBuilderPageClient params={p} />
}