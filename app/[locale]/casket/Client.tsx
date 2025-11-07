'use client'

import { DeckBuilderPageParams } from "./page"
import { CardImage } from "@/components/CardImage"
import { useState } from "react"
import { useLocalCardsData } from "@/hooks/useLocalCardsData"

export function DeckBuilderPageClient ({
  params
}: {
  params: DeckBuilderPageParams
}) {
  const { locale } = params
  const localCardsData = useLocalCardsData(locale);
  const { characters, actions, codes } = localCardsData;

  const [character, setCharacter] = useState("test");

  return <div className="flex flex-wrap gap-5">
    <div className="mt-6 border-1 border-gray-400 rounded-xl py-6 px-2 w-100 h-[65vh] overflow-y-auto flex flex-wrap justify-center gap-2 gap-y-3 prevent_select">{characters.map(c =>
      <div key={c.id} className="relative">
        <div onClick={() => setCharacter(c.name)} className="cursor-pointer">
          <CardImage
            cardType="characters"
            cardId={c.id}
            size="medium"
            borderType="normal"
            resize={false}
            localCardsData={localCardsData}
          />
        </div>
        <div className="absolute z-12 -top-0.25 -left-0.5 min-w-5 genshin_font text-center text-white font-semibold text_outline items-end pointer-events-none">{c.hp}</div>
        <img src="/game_icons/hp.png" className="absolute size-8 z-11 -top-1.5 -left-2 pointer-events-none" />
      </div>
    )}</div>
    <div className="min-w-100">{character}</div>
  </div>
}