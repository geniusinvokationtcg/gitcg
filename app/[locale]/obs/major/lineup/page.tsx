"use client"

import { CardImage } from "@/components/CardImage"
import { useLiveMajor } from "@/hooks/useLiveMatch"
import { useMajorData, useMajorMetadataByUuid } from "@/hooks/useMajorData"
import { supabase } from "@/lib/supabaseClient"
import { generateRoundStructure } from "@/utils/brackets"
import { decode, decodeAndSortActionCards } from "@/utils/decoder"
import { getPlayer } from "@/utils/major"
import { MajorPlayer } from "@/utils/types"
import { notFound } from "next/navigation"

export default function MajorLineupPage () {  
  const live = useLiveMajor()

  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  if(!live.data || !majorMetadata.data) return "Loading";

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server
  
  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const { seeding, games } = generateRoundStructure(majorData.max_players)

  if(!liveMatch || !seeding) notFound();

  const matchid = liveMatch.matchid

  const player1 = getPlayer(matchid, 1, majorData, games, seeding);
  const player2 = getPlayer(matchid, 2, majorData, games, seeding);
  if(!player1 || !player2 || majorData.bracket.find(m => m.matchid === matchid)?.is_bye) notFound();
  const score1 = liveMatch.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = liveMatch.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);

  function getDeckStatus(playerNum: 1 | 2, deckcodeIndex: number): "none" | "banned" | "win" {
    if(liveMatch?.bans?.[playerNum-1] === deckcodeIndex+1 || liveMatch?.bans2?.[playerNum-1] === deckcodeIndex+1) return "banned";

    if(liveMatch?.games.some(game => game.deck_index[playerNum-1] === deckcodeIndex+1 && game.winner === playerNum)) return "win";

    return "none"
  }

  return <div style={{ width: 1500, height: 600 }} className="flex flex-row gap-8 justify-center">
    <div className="flex flex-row gap-8">
      <div className="flex flex-col gap-4 justify-center items-center">
        <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-1 size-70 flex justify-center items-center">
          <img src={`/major/${version}/avatar/${server}/${player1.seed}.png`} className="w-full rounded-[50%]" />
        </div>
        <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[24px] text-center bg-[#fad38c] w-80 p-2 mb-1 rounded-[5rem] overflow-hidden">
          {player1.name}
        </div>
        <div className="size-16 flex justify-center items-center text-[30px] genshin_font z-11 -translate-y-1">
          <div className="relative">
            <img src="/game_icons/hp.png" />
            <div style={{ textShadow: "1.5px 1.5px 0 black" }} className="absolute w-20 text-white text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score1}</div>
          </div>
        </div>
      </div>

      <div style={{ width: "320px" }} className="flex flex-col gap-4 justify-center items-center">
        {player1.deckcode.map((deck, deckIndex) => {
          const characterCards = decodeAndSortActionCards(deck).slice(0, 3);
          const deckStatus = getDeckStatus(1, deckIndex)
          return <div key={deck} className="relative flex flex-row gap-1.5">
            {
              <div className={`${deckStatus === "none" ? "opacity-0" : "opacity-100"} h-7 transition-opacity duration-300 absolute w-full ${deckStatus === "banned" ? "bg-red-500" : "bg-[#B97932]"} z-11 text-white text-center genshin_font p-0.5 bottom-1/5 translate-y-1/2`}>
                {(() => {
                  switch(deckStatus) {
                    case "banned": return "Banned"
                    case "win": return "Win"
                  }
                })()}
              </div>
            }

            {characterCards.map(c =>
              <CardImage
                key={c}
                cardType="characters"
                cardId = {c}
                size = {100}
                borderType="lustrous"
              />
            )}
          </div>
        })}
      </div>
    </div>

    <div className="border-l-2 border-[#00000079]"/>

    <div className="flex flex-row gap-8">
      <div style={{ width: "320px" }} className="flex flex-col gap-4 justify-center items-center">
        {player2.deckcode.map((deck, deckIndex) => {
          const characterCards = decodeAndSortActionCards(deck).slice(0, 3);
          const deckStatus = getDeckStatus(2, deckIndex)
          return <div key={deck} className="relative flex flex-row gap-1.5">
            {
              <div className={`${deckStatus === "none" ? "opacity-0" : "opacity-100"} h-7 transition-opacity duration-300 absolute w-full ${deckStatus === "banned" ? "bg-red-500" : "bg-[#B97932]"} z-11 text-white text-center genshin_font p-0.5 bottom-1/5 translate-y-1/2`}>
                {(() => {
                  switch(deckStatus) {
                    case "banned": return "Banned"
                    case "win": return "Win"
                  }
                })()}
              </div>
            }

            {characterCards.map(c =>
              <CardImage
                key={c}
                cardType="characters"
                cardId = {c}
                size = {100}
                borderType="lustrous"
              />
            )}
          </div>
        })}
      </div>

      <div className="flex flex-col gap-4 justify-center items-center">
        <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-1 size-70 flex justify-center items-center">
          <img src={`/major/${version}/avatar/${server}/${player2.seed}.png`} className="w-full rounded-[50%]" />
        </div>
        <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[24px] text-center bg-[#fad38c] w-80 p-2 mb-1 rounded-[5rem] overflow-hidden">
          {player2.name}
        </div>
        <div className="size-16 flex justify-center items-center text-[30px] genshin_font z-11 -translate-y-1">
          <div className="relative">
            <img src="/game_icons/hp.png" />
            <div style={{ textShadow: "1.5px 1.5px 0 black" }} className="absolute w-20 text-white text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score2}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
}