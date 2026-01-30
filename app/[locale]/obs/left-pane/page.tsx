"use client";

import { useCsvPaste } from "@/hooks/useCsvPaste";
import { useDuelistRecord } from "@/hooks/useDuelistRecord";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { CardImage } from "@/components/CardImage";

export default function LeftPaneOverlay() {
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

  const nameTop = duelistRecord.find(duelist => duelist[`uid_${server}`] === top)?.handle_display || playerTop?.teamName || "N/A"
  const nameBottom = duelistRecord.find(duelist => duelist[`uid_${server}`] === bottom)?.handle_display || playerBottom?.teamName || "N/A"

  return <div style={{ background: "transparent", width: 548 }} className="flex flex-col gap-[106px]">
    <DeckLeftPaneCard
      playerName={nameTop}
      deck={deckTop}
      omit={!playerTop || deckTop.length === 0}
    />
    <DeckLeftPaneCard
      playerName={nameBottom}
      deck={deckBottom}
      omit={!playerBottom || deckBottom.length === 0}
    />
  </div>
}

function DeckLeftPaneCard({ playerName, deck, omit }: { playerName: string; deck: number[]; omit?: boolean }) {
  const actions = deck.slice(3, 33);

  return <div style={{ width: 548, height: 470 }} className={`flex flex-col gap-2 mt-3.5 items-center ${omit ? "opacity-0" : "opacity-100"}`}>
    <div className="genshin_font text-[32px] text-center whitespace-nowrap text-ellipsis">
      {playerName}
    </div>

    <div className="grid grid-cols-8 gap-[5px] justify-center mt-0.5">
      {actions.map((c, i) =>
        <CardImage
          key={i}
          cardType="actions"
          cardId={c}
          size={53}
          borderType="lustrous"
        />
      )}
    </div>
  </div>
}