"use client"

import { CsvPasteRowClient, DuelistRecord } from "@/utils/types";
import { DecklistDumpPageParams } from "../page";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { CardImage } from "@/components/CardImage";
import { useState } from "react";

export default function NextMatch ({ params, csvPaste, duelistRecord, top, bottom, round }: { params: DecklistDumpPageParams, csvPaste: CsvPasteRowClient[], duelistRecord: DuelistRecord[], top?: number, bottom?: number, round?: number }) {
  const playerTop = csvPaste.find(row => row.uid === top);
  const playerBottom = csvPaste.find(row => row.uid === bottom);

  const deckTop = playerTop && isValidDeckcode(playerTop?.deckcode) ? decodeAndSortActionCards(playerTop.deckcode) : [];
  const deckBottom = playerBottom && isValidDeckcode(playerBottom?.deckcode) ? decodeAndSortActionCards(playerBottom.deckcode) : [];

  const [showMsg, setShowMsg] = useState(round && round > 0);
  const [showDeck, setShowDeck] = useState(true);

  return <div className="relative flex flex-row justify-center align-middle gap-4 items-center text-[30px] text-center h-40 prevent_select">
    <div className={`absolute z-1 genshin_font -top-0 text-[24px] italic transition-all duration-200 ${showMsg ? "opacity-100" : "opacity-0"}`}>{`${round && round > 0 ? `ROUND ${round}` : "NEXT MATCH"}`}</div>
    <div className={`}relative bg-[#fdca90] p-4 ${showDeck ? "pl-54" : ""} w-156 h-20 genshin_font rounded-[5rem] basic_shadow-bottom`} onClick={() => setShowDeck(prev => !prev)}>
      <div>{playerTop?.teamName}</div>
      <div className={`absolute flex flex-row gap-0.5 left-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${showDeck ? "opacity-100" : "opacity-0"}`}>
        {deckTop.slice(0, 3).map(id =>
          <CardImage
            key={id}
            cardType="characters"
            cardId={id}
            size={70}
            borderType="lustrous"
          />
        )}
      </div>
    </div>
    <div className="genshin_font italic text-[44px] -translate-x-1" onClick={() => setShowMsg(prev => !prev)}>VS</div>
    <div className={`}relative bg-[#fdca90] p-4 ${showDeck ? "pr-54" : ""} w-156 h-20 genshin_font rounded-[5rem] basic_shadow-bottom`} onClick={() => setShowDeck(prev => !prev)}>
      <div>{playerBottom?.teamName}</div>
      <div className={`absolute flex flex-row gap-0.5 right-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${showDeck ? "opacity-100" : "opacity-0"}`}>
        {deckBottom.slice(0, 3).map(id =>
          <CardImage
            key={id}
            cardType="characters"
            cardId={id}
            size={70}
            borderType="lustrous"
          />
        )}
      </div>
    </div>
  </div>
}