"use client";

import { CardImage } from "@/components/CardImage";
import { useCsvPaste } from "@/hooks/useCsvPaste";
import { useDuelistRecord } from "@/hooks/useDuelistRecord";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { useState } from "react";

export default function NextMatchOverlay() {
  let { data, error } = useLiveMatch();
  const duelistRecord = useDuelistRecord();

  const csvPasteAPIRes = useCsvPaste(data?.weekly_uuid || "")

  if (error) return "Error: " + error;
  if (!data) return "Match loading";
  if (!duelistRecord) return "DR loading";
  if (!csvPasteAPIRes.csvPaste) return "CSV loading";

  const { server, csvPaste } = csvPasteAPIRes.csvPaste;

  const top = data.first_player_uid
  const bottom = data.second_player_uid

  const playerTop = csvPaste.find(row => row.uid === top);
  const playerBottom = csvPaste.find(row => row.uid === bottom);

  const deckTop = playerTop && isValidDeckcode(playerTop?.deckcode) ? decodeAndSortActionCards(playerTop.deckcode) : [];
  const deckBottom = playerBottom && isValidDeckcode(playerBottom?.deckcode) ? decodeAndSortActionCards(playerBottom.deckcode) : [];

  return <div className="flex flex-row justify-center items-center align-middle gap-4 prevent_select h-fit">
    <div className={`flex flex-wrap gap-1 w-156`}>
      {deckTop.slice(3).map((id, i) =>
        <CardImage
          key={i}
          cardType="actions"
          cardId={id}
          size={70}
          borderType="lustrous"
        />
      )}
    </div>
    <div className="genshin_font italic text-[44px] -translate-x-1 opacity-0" >VS</div>
    <div className={`flex flex-wrap gap-1 w-156`}>
      {deckBottom.slice(3).map((id, i) =>
        <CardImage
          key={i}
          cardType="actions"
          cardId={id}
          size={70}
          borderType="lustrous"
        />
      )}
    </div>
  </div>
}