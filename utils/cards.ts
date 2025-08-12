import cardsData from "@/cards.json";
import cardsData_cn from "@/cards_cn.json";
import { CardType } from "./types"; 

export function getCardImageUrl(
  cardType: CardType,
  keyword: string | number,
  byWhat?: "name" | "id"
): string{
  if(!byWhat) byWhat = "name";
  const cardList = cardType === "characters" ? cardsData.characters : cardsData.actions
  return cardList.find(card => card[byWhat] === keyword)?.resource || "notFound()";
}

export function getCardName (cardId: number, cardType: CardType, locale?: string): string {
  const name = cardsData[cardType].find(c => c.id === cardId)?.name;
  if(!name) return "";
  const localized = localizeCardName(name, cardType, locale);
  return localized || name;
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

export function localizeCardName (cardName: string, cardType: CardType, locale?: string): string {

  if(!locale) return cardName;
  const localizable = ["zh-cn"];
  if(!localizable.includes(locale)) return cardName;
  
  if(locale === "zh-cn") {
    var localCardsData = cardsData_cn;
  } else {
    return cardName;
  }
  
  const cardId = cardsData[cardType].find(card => card.name === cardName)?.id;
  if(!cardId) return cardName;
    
  return localCardsData[cardType].find(card => card.id === cardId)?.name || "error";
}