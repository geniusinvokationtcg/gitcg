import { CardsDataType, Locales } from "@/utils/types";

export async function getLocalCardsData (locale: Locales) {
  let localCardsData: CardsDataType;

  try {
    localCardsData = await import(`@/cards/cards_${locale}.json`);
  }
  catch (e) {
    localCardsData = await import("@/cards.json");
  }

  return localCardsData;
}