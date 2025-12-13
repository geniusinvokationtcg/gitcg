"use client"

import { CsvPasteRowClient, DuelistRecord } from "@/utils/types"
import { DecklistDumpPageParams } from "../page"
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder"
import { DeckLeftPaneCard } from "./DeckCard";

export default function DeckPopUpPage ({ params, csvPaste, duelistRecord, top, bottom }: { params: DecklistDumpPageParams, csvPaste: CsvPasteRowClient[], duelistRecord: DuelistRecord[], top?: number, bottom?: number }) {
  const { server } = params;
  
  const playerTop = csvPaste.find(row => row.uid === top);
  const playerBottom = csvPaste.find(row => row.uid === bottom);

  const deckTop = playerTop && isValidDeckcode(playerTop?.deckcode) ? decodeAndSortActionCards(playerTop.deckcode) : [];
  const deckBottom = playerBottom && isValidDeckcode(playerBottom?.deckcode) ? decodeAndSortActionCards(playerBottom.deckcode) : [];
  
  return <div style={{ background: "transparent", width: 548 }} className="flex flex-col gap-[106px]">
    <DeckLeftPaneCard
      playerName={duelistRecord.find(duelist => duelist[`uid_${server}`] === top)?.handle_display || playerTop?.teamName || "N/A"}
      deck={deckTop}
      omit={!playerTop || deckTop.length === 0}
    />
    <DeckLeftPaneCard
      playerName={duelistRecord.find(duelist => duelist[`uid_${server}`] === bottom)?.handle_display || playerBottom?.teamName || "N/A"}
      deck={deckBottom}
      omit={!playerBottom || deckBottom.length === 0}
    />
  </div>
}