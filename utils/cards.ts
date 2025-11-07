import cardsData from "@/cards.json";
import { CardType, CardsDataType } from "./types";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";

export function getCardImageUrl(
  cardType: CardType,
  keyword: string | number,
  byWhat?: "name" | "id",
  width?: number
): string | undefined {
  if(!byWhat) byWhat = "name";
  const cardList = cardType === "characters" ? cardsData.characters : cardsData.actions
  const link = cardList.find(card => card[byWhat] === keyword)?.resource
  if(!link) return undefined;
  return width ? `${link}?x-oss-process=image/format,png/quality,Q_90/resize,s_${width}` : link;
}

export function getCardName (cardId: number, localCardsData?: CardsDataType): string {
  if(!localCardsData) localCardsData = cardsData
  return localCardsData.codes.find(c => c.id === cardId)?.name || ""
}

export function getCardIdByName (cardName: string, cardType: CardType): number {
  const id = cardsData[cardType].find(c => c.name === cardName)?.id;
  return id || NaN;
}

export function isArcaneLegend (cardId: number): boolean {
  const card = cardsData.actions.find(c => c.id === cardId);
  if(!card) return false;
  return card.is_special;
}