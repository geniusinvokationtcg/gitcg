"use client"

import { CsvPasteRowClient, DuelistRecord } from "@/utils/types";
import { DecklistDumpPageParams } from "../page";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { CardImage } from "@/components/CardImage";
import CharacterCardMostUsed from "./CharacterCardMostUsed";

export default function DeckSlideshow ({ params, csvPaste, duelistRecord }: { params: DecklistDumpPageParams, csvPaste: CsvPasteRowClient[], duelistRecord: DuelistRecord[] }) {
  const { server } = params;

  const transformedData = csvPaste.map(row => ({
    ...row,
    isValidDeckcode: isValidDeckcode(row.deckcode),
    decoded: decodeAndSortActionCards(row.deckcode)
  })).filter(row => row.isValidDeckcode.result)
  
  const [playerIndex, setPlayerIndex] = useState(transformedData.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlayerIndex(prev => (prev + 1) % (transformedData.length + 1));
    }, 10000)

    return () => clearInterval(timer)
  }, [transformedData.length])

  const currentPlayer = transformedData[playerIndex >= transformedData.length ? 0 : playerIndex];

  const name = duelistRecord.find(duelist => duelist[`uid_${server}`] === currentPlayer.uid)?.handle_display || currentPlayer.teamName;
  const deck = currentPlayer.decoded;
  const characters = deck.slice(0, 3);
  const actions = deck.slice(3, 33);

  return <div style={{ background: "transparent", width: "auto" }} className="mt-6 mx-6">
    <AnimatePresence mode="wait">
      <motion.div
        key={playerIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        className="flex flex-col gap-3 justify-center items-center overflow-hidden"
      >
        {playerIndex === transformedData.length ? <CharacterCardMostUsed csvPaste={transformedData}/> : <>
          <div className="genshin_font text-[3rem]">{name}</div>
          
          <div className="flex flex-row gap-2">
            {characters.map(c =>
              <CardImage
                key={c}
                cardType="characters"
                cardId={c}
                size={"large"}
                borderType="lustrous"
              />
            )}
          </div>

          <div className="grid grid-cols-10 gap-1">
            {actions.map((c, i) =>
              <CardImage
                key={i}
                cardType="actions"
                cardId={c}
                size={75}
                borderType="lustrous"
              />
            )}
          </div>
        </>}

      </motion.div>
    </AnimatePresence>
  </div>
}