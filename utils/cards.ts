"use client";

import cardsData from "@/cards.json";
import _talents from "./talents.json";
import { CardType, CardsDataType, Elements } from "./types";

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

export function isValidCard (cardId: number, characterCards: (number | null)[]) {
  const characterTraits: {
    element: Elements | undefined; tribe: string[]; talentId: number | undefined;
  }[] = [];
  for(let char of characterCards) {
    if(char === null) continue;

    const detail = cardsData.characters.find(c => c.id === char);
    if(!detail) continue;

    characterTraits.push({
      element: getElement(detail.element_type),
      tribe: [...detail.belongs],
      talentId: talents.find(t => t.character_id === char)?.talent_id
    })
  }
  
  //check element resonance
  const elements = elementResonance.filter(res => res.card_id.includes(cardId));
  for(let { element } of elements) {
    const eligible = characterTraits.filter(char => char.element === element);
    if(eligible.length < 2) return false;
  }

  //check tribe resonance
  const tribes = tribeResonance.filter(res => res.card_id.includes(cardId));
  for(let { tribe } of tribes) {
    const eligible = characterTraits.filter(char => char.tribe.includes(tribe));
    if(eligible.length < 2) return false;
  }

  //check talent (the id for talents is 2xxxxx)
  if(cardId < 300000 && !characterTraits.some(char => char.talentId === cardId)) return false;

  return true;
}

export const elementResonance: {
	element: Elements,
	card_id: number[]
}[] = [
	{
		element: "cryo",
		card_id: [331101, 331102]
	},
	{
		element: "hydro",
		card_id: [331201, 331202]
	},
	{
		element: "pyro",
		card_id: [331301, 331302]
	},
	{
		element: "electro",
		card_id: [331401, 331402]
	},
	{
		element: "anemo",
		card_id: [331501, 331502]
	},
	{
		element: "geo",
		card_id: [331601, 331602]
	},
	{
		element: "dendro",
		card_id: [331701, 331702]
	}
]

export const tribeResonance: {
	tribe: string,
	card_id: number[]
}[] = [
	{
		tribe: "Mondstadt",
		card_id: [331801]
	},
	{
		tribe: "Liyue",
		card_id: [331802]
	},
	{
		tribe: "Inazuma",
		card_id: [331803]
	},
	{
		tribe: "Sumeru",
		card_id: [331804]
	},
	{
		tribe: "Fontaine",
		card_id: [331805]
	},
	{
		tribe: "Natlan",
		card_id: [331806]
	},
	{
		tribe: "Monster",
		card_id: [332015]
	},
	{
		tribe: "Fatui",
		card_id: [332016]
	}
]

export function getElement(code: number): Elements | undefined {
	switch(code){
		case 301: return "cryo"
		case 302: return "hydro"
		case 303: return "pyro"
		case 304: return "electro"
		case 305: return "geo"
		case 306: return "dendro"
		case 307: return "anemo"
		default: return
	}
}

export const talents = _talents;