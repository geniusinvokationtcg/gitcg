import { getCardImageUrl, isArcaneLegend, getCardName } from "@/utils/cards"
import { CardType } from "@/utils/types"

export function CardImageMedium ({ cardType, cardId, resize, locale }: { cardType: CardType; cardId: number; resize?: boolean; locale?: string }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_medium ${resize ? "card_image_medium_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id")} title={getCardName(cardId, cardType, locale)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}