"use client"

import { CardImage } from "@/components/CardImage";
import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid } from "@/hooks/useMajorData";
import { decodeAndSortActionCards } from "@/utils/decoder";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function MajorDeckCarouselOverlay () {
  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  const liveData = live.data
  const majorData = majorMetadata.data?.content

  const players = (majorData?.players || []).map(player => ({
    ...player,
    decoded: player.deckcode.map(deck => decodeAndSortActionCards(deck))
  }))
  console.log(players)
  const [playerIndex, setPlayerIndex] = useState(0);
  
  useEffect(() => {
    if(!players) return;

    const timer = setInterval(() => {
      setPlayerIndex(prev => (prev + 1) % players.length);
    }, 10000)

    return () => clearInterval(timer)
  }, [players])

  const currentPlayer = players[playerIndex]
  console.log(currentPlayer)

  if(!majorMetadata.data || !currentPlayer) return "Loading";

  return <div className="flex justify-center items-center">
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
        className="flex flex-col gap-2 justify-center items-center overflow-hidden"
      >
        <div className="genshin_font text-[2.5rem]">{currentPlayer.name}</div>
        <div className="flex flex-row gap-6">
          {currentPlayer.decoded.map(d => {
            const characters = d.slice(0, 3)

            return <div className="flex flex-row gap-1" key={characters.join(",")}>
              {characters.map(c =>
                <CardImage
                  key={c}
                  cardType="characters"
                  cardId={c}
                  size={"medium"}
                  borderType="lustrous"
                />
              )}
            </div>
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
}