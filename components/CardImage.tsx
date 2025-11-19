import { getCardImageUrl, isArcaneLegend, getCardName } from "@/utils/cards"
import { BorderType, CardType, CardsDataType } from "@/utils/types"

export function CardImageSmall ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_small ${resize ? "card_image_small_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 110)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImageMedium ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_medium ${resize ? "card_image_medium_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 140)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImageLarge ({ cardType, cardId, resize, localCardsData }: { cardType: CardType; cardId: number; resize?: boolean; localCardsData?: CardsDataType }) {
  if(typeof resize === "undefined") resize = true;
  return <div className={`card_image_large ${resize ? "card_image_large_resize" : ""}`}>
    <img src={getCardImageUrl(cardType, cardId, "id", 180)} title={getCardName(cardId, localCardsData)}></img>
    <img src={`/borders/normal${isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export function CardImage ({ cardType, cardId, size, dynamicImagePx = false, borderType = "normal", resize = true, localCardsData }: {
  cardType: CardType;
  cardId: number | null;
  size: CardImageSize | number;
  dynamicImagePx?: boolean;
  borderType?: BorderType;
  resize?: boolean;
  localCardsData?: CardsDataType;
}) {
  let px = 100;
  switch(size){
    case "small": px = 110; break;
    case "medium": px = 140; break;
    case "large": px = 180; break;
    default: {
      if(dynamicImagePx) { px = px+60 }
      else if(size < 50) { px = 110 }
      else if(size < 80) { px = 140 }
      else { px = 180 }
    };
  }

  const isCustom = typeof size === "number"

  const containerStyle: React.CSSProperties | undefined = isCustom ? {
    position: "relative",
    width: isCustom ? size : 120
  } : undefined
  const cardImageStyle: React.CSSProperties | undefined = isCustom ? {
    position: "absolute",
    width: "98%",
    padding: "2px 0.5px",
    objectFit: "contain",
    zIndex: 0
  } : undefined
  const borderStyle: React.CSSProperties | undefined = isCustom ? {
    position: "relative",
    zIndex: 10,
    pointerEvents: "none"
  } : undefined

  return <div
    className={`prevent_select ${isCustom ? "" : `card_image_${size} ${resize ? `card_image_${size}_resize` : ""}`}`}
    style={containerStyle}
  >
    {
      cardId
      ? <img style={cardImageStyle} src={getCardImageUrl(cardType, cardId, "id", px)} title={getCardName(cardId, localCardsData)}></img>
      : <img style={cardImageStyle} src="/game_icons/Origin_Card_Back.webp" className="null" />
    }
    <img style={borderStyle} src={`/borders/${borderType}${cardId && isArcaneLegend(cardId) ? "_esoteric": ""}.png`}></img>
  </div>
}

export type CardImageSize = "small" | "medium" | "large"