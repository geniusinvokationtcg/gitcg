import { getCardImageUrl, isArcaneLegend, getCardName } from "@/utils/cards"
import { CardType, CardsDataType } from "@/utils/types"

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