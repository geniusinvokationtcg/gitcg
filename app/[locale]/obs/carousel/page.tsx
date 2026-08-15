"use client";

import { CardImage } from "@/components/CardImage";
import { useCsvPaste } from "@/hooks/useCsvPaste";
import { useDuelistRecord } from "@/hooks/useDuelistRecord";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { percentize } from "@/utils/formatting";
import { CardType, CsvPasteRowClient } from "@/utils/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DeckCarouselOverlay() {
  let { data, error } = useLiveMatch();
  const duelistRecord = useDuelistRecord();

  const csvPasteAPIRes = useCsvPaste(data?.weekly_uuid || "")

  const server = csvPasteAPIRes.csvPaste?.server ?? "as"
  const csvPaste = csvPasteAPIRes.csvPaste?.csvPaste ?? []

  const transformedData = csvPaste.map(row => ({
    ...row,
    isValidDeckcode: isValidDeckcode(row.deckcode),
    decoded: decodeAndSortActionCards(row.deckcode)
  })).filter(row => row.isValidDeckcode.result && row.isCheckedIn)

  const [slideIndex, setSlideIndex] = useState(0)

  const mostUsedCharSlide = <CardMostUsed csvPaste={transformedData} type="characters"/>
  const mostUsedActionSlide = <CardMostUsed csvPaste={transformedData} type="actions"/>
  const deckSlides = transformedData.map(player => {
    const name = duelistRecord ? duelistRecord.find(duelist => duelist[`uid_${server}`] === player.uid)?.handle_display || player.teamName : "N/A";
    const deck = player.decoded;
    const characters = deck.slice(0, 3);
    const actions = deck.slice(3, 33);
    
    return <>
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
    </>
  })

  const slides = [
    mostUsedCharSlide,
    mostUsedActionSlide,
    ...deckSlides
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 10000)

    return () => clearInterval(timer)
  }, [slides.length])

  if (error) return "Error: " + error;
  if (!data) return "Match loading";
  if (!duelistRecord) return "DR loading";
  if (!csvPasteAPIRes) return "CSV loading";

  return <div style={{ background: "transparent", width: "auto" }} className="mt-6 mx-6">
    <AnimatePresence mode="wait">
      <motion.div
        key={slideIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        className="flex flex-col gap-3 justify-center items-center overflow-hidden"
      >
        {slides[slideIndex]}
      </motion.div>
    </AnimatePresence>
  </div>
}

interface CsvPasteRowClientTransformed extends CsvPasteRowClient {
  isValidDeckcode: { result: boolean, reason: string }
  decoded: number[]
}

export function CardMostUsed ({ csvPaste, type }: { csvPaste: CsvPasteRowClientTransformed[]; type: CardType }) {
  console.log(csvPaste)
  const cardsMap: Map<number, number> = new Map();

  const startIndex = type === "characters" ? 0 : 3
  const endIndex = type === "characters" ? 3 : 33
  
  csvPaste.forEach(row => {
    let cardsAlreadyChecked: number[] = []
    for (let i = startIndex; i < endIndex; i++) {
      const id = row.decoded[i];
      if(cardsAlreadyChecked.includes(id)) {
        continue;
      } else {
        cardsAlreadyChecked = [...cardsAlreadyChecked, id]
      }
      cardsMap.set(id, (cardsMap.get(id) ?? 0) + 1);
    }
  })

  const cards = Array.from(cardsMap.entries());
  cards.sort(([, a], [, b]) => b-a);

  const localCardsData = useLocalCardsData();

  return <div className="genshin_font text-center flex flex-col gap-2 justify-center items-center">
    <p className="text-[3rem]">{`Most used ${type === "characters" ? "characters" : "action cards"}`}</p>
    <div className="flex flex-row gap-6">
      {cards.slice(0, 2).map(([id, count]) =>
        <div key={id} className="flex flex-col gap-2 justify-center items-center">
          <CardImage
            cardType={type}
            cardId={id}
            size={150}
            borderType="lustrous"
          />
          <div
            style={{
              boxShadow: "1px 1px 0 black"
            }}
            className="bg-[#fad38c] px-4 h-10 w-56 max-w-56 rounded-r-3xl rounded-b-3xl flex items-center justify-center"
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.25rem]">{localCardsData.codes.find(c => c.id === id)?.name || ""}</p>
          </div>
          <p className="text-[1.5rem]">{`${count}/${csvPaste.length} (${percentize(count/csvPaste.length, "en")})`}</p>
        </div>
      )}
    </div>

    <div className="flex flex-row gap-4">
      {cards.slice(2, 5).map(([id, count]) =>
        <div key={id} className="flex flex-col gap-2 justify-center items-center">
          <CardImage
            cardType={type}
            cardId={id}
            size={120}
            borderType="lustrous"
          />
          <div
            style={{
              boxShadow: "1px 1px 0 black"
            }}
            className="bg-[#fad38c] px-4 h-8 w-44 max-w-44 rounded-r-3xl rounded-b-3xl flex items-center justify-center"
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.15rem]">{localCardsData.codes.find(c => c.id === id)?.name || ""}</p>
          </div>
          <p className="text-[1.25rem]">{`${count}/${csvPaste.length} (${percentize(count/csvPaste.length, "en")})`}</p>
        </div>
      )}
    </div>
  </div>
}