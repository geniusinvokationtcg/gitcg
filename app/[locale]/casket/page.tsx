import { getLocalCardsData } from "@/cards/localCardsData";
import { Locales } from "@/utils/types";
import { DeckBuilderPageClient } from "./Client";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export interface DeckBuilderPageParams {
  locale: Locales
}

export async function generateMetadata ({ params }: { params: Promise<DeckBuilderPageParams> }): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations("DeckBuilderPage");

  const metadata = {
    title: t("title"),
    description: t("description")
  }

  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default async function DeckBuilderPage ({ params }: { params: Promise<DeckBuilderPageParams> }) {
  const p = await params;
  const { locale } = p;

  let localCardsData = await getLocalCardsData(locale);

  return <DeckBuilderPageClient params={p} />
}