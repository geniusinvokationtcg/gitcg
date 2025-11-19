"use client"

import { CardImage } from "@/components/CardImage";
import { CardsDataType } from "@/utils/types";
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities";

export function ActiveCharacterCard ({ localCardsData, id, cardId, isLocked = false }: {localCardsData: CardsDataType, id: number, cardId: number | null, isLocked?: boolean} ) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id});

  const style = {
    transition,
    transform: CSS.Transform.toString(transform)
  }

  return <div ref={setNodeRef} {...attributes} {...listeners} style={style} className="character_card_image touch-none z-15">
    <div className={cardId && !isLocked ? "" : "disabled"}>
      <CardImage
        cardType="characters"
        cardId={cardId}
        size="medium"
        borderType="normal"
        resize={false}
        localCardsData={localCardsData}
      />
    </div>
    <div>{localCardsData.characters.find(_c => _c.id === cardId)?.hp}</div>
    <img src="/game_icons/hp.png" className={cardId ? "" : "hidden"} />
  </div>
}