import { getCardImageUrl, isArcaneLegend, getCardName } from "@/utils/cards"
import { BorderType, CardType, CardsDataType } from "@/utils/types"

export function CardImageSmall ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_small ${resize ? "card_image_small_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 70)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImageMedium ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_medium ${resize ? "card_image_medium_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 100)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImageLarge ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_large ${resize ? "card_image_large_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 140)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImage ({ cardType, cardId, size, borderType = "normal", resize = true, localCardsData }: {
  cardType: CardType;
  cardId: number;
  size: CardImageSize;
  borderType?: BorderType
  resize?: boolean;
  localCardsData?: CardsDataType;
}) {
  let px = 100;
  switch(size){
    case "small": px = 70; break;
    case "medium": px = 100; break;
    case "large": px = 140; break;
  }

  return <div className={`card_image_${size} ${resize ? `card_image_${size}_resize` : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", px)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/${borderType}${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export type CardImageSize = "small" | "medium" | "large"