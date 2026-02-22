"use client"

import { CardImage } from "@/components/CardImage";
import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid } from "@/hooks/useMajorData";
import { generateRoundStructure } from "@/utils/brackets";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { percentize } from "@/utils/formatting";
import { getPlayer } from "@/utils/major";
import { MajorPlayer } from "@/utils/types";
import { AnimatePresence, motion } from "framer-motion";

export default function MajorLeftPaneOverlay () {
  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  if(!live.data || !majorMetadata.data) return "Loading";

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server

  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const liveGame = liveMatch?.games[liveData.game-1];
  const { seeding, games } = generateRoundStructure(majorData.max_players)

  if(!liveMatch || !seeding) return "Bracket or seeding error";

  const matchid = liveMatch.matchid

  const playerTop = getPlayer(matchid, 1, majorData, games, seeding);
  const playerBottom = getPlayer(matchid, 2, majorData, games, seeding);
  if(!playerTop || !playerBottom || majorData.bracket.find(m => m.matchid === matchid)?.is_bye) return "Player not found";
  const scoreTop = liveMatch.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const scoreBottom = liveMatch.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);

  const deckIndexTop = liveGame?.deck_index?.[0]
  const deckIndexBottom = liveGame?.deck_index?.[1]

  const deckTop = deckIndexTop && isValidDeckcode(playerTop.deckcode[deckIndexTop-1]) ? decodeAndSortActionCards(playerTop.deckcode[deckIndexTop-1]) : []
  const deckBottom = deckIndexBottom && isValidDeckcode(playerBottom.deckcode[deckIndexBottom-1]) ? decodeAndSortActionCards(playerBottom.deckcode[deckIndexBottom-1]) : []

  function DeckLeftPaneCard({ player, deck }: { player: MajorPlayer, deck: number[]}) {
    // deck = []
    const state = deck.length ? "decklist" : "avatar"
    const actions = deck.slice(3, 33);
    const score = player.name === playerTop?.name ? scoreTop : (player.name === playerBottom?.name ? scoreBottom : 0)

    return <div style={{ width: 548, height: 470 }} className={`flex flex-col gap-2 mt-3.5 items-center`}>
      <div className="flex flex-row genshin_font text-[32px] whitespace-nowrap text-ellipsis mb-0.5 w-77">
        {/* <div className="text-center w-16">{score}</div>
        <div>|</div> */}
        <div className="text-center w-full">{player.name}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div 
          key={state}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
        >
          {(() => {
            if(state === "avatar") return <div style={{ height: 380 }} className="flex flex-col gap-7 justify-center items-center">
              <div style={{ boxShadow: "0 1.5px 0 black" }} className="relative bg-[#DCCBB1] rounded-[50%] p-1 size-60 flex justify-center items-center">
                <img src={`/major/${version}/avatar/${server}/${player.seed}.png`} className="rounded-[50%]" />
                <div className="absolute size-20 text-white flex justify-center items-center text-[30px] genshin_font top-0 left-0">
                  <div className="relative">
                    <img src="/game_icons/hp.png" />
                    <div className="absolute w-20 text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score}</div>
                  </div>
                </div>
              </div>
              <div className="genshin_font text-3xl">
                {(() => {
                  if(!liveMatch) return "";

                  let game_count = 0;
                  let win_count = 0;

                  for(let i=1; i <= liveData.match; i++) {
                    let playerIndex: null | 1 | 2 = null
                    
                    if(!seeding) continue;
                    if(getPlayer(i, 1, majorData, games, seeding)?.seed === player.seed) {
                      playerIndex = 1
                    } else if(getPlayer(i, 2, majorData, games, seeding)?.seed === player.seed) {
                      playerIndex = 2
                    } else {
                      continue;
                    }

                    const loadedMatch = majorData.bracket.find(m => m.matchid === i)
                    
                    loadedMatch?.games.forEach((game, gameIndex) => {
                      if(!(loadedMatch.matchid === liveData.match && gameIndex+1 >= liveData.game)){
                        game_count++;
                        if(game.winner === playerIndex) win_count++;
                      }
                    })
                  }

                  const win_rate = game_count === 0 ? 0 : win_count / game_count
                  
                  return `WR ${percentize(win_rate, "en")} | ${win_count}/${game_count}`
                })()}
              </div>
            </div>
            
            if(state === "decklist") return <div className="relative">
              <div className="relative grid grid-cols-8 gap-[5px] justify-center">
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
              <div style={{ boxShadow: "0 1.5px 0 black" }} className="absolute bg-[#DCCBB1] rounded-[50%] p-0.5 size-16 flex justify-center items-center -top-17 left-4.25 z-11">
                <img src={`/major/${version}/avatar/${server}/${player.seed}.png`} className="rounded-[50%]" />
              </div>
              <div className="absolute size-20 flex justify-center items-center text-[30px] genshin_font -top-19 right-4.25 z-11">
                <div className="relative">
                  <img src="/game_icons/hp.png" />
                  <div className="absolute w-20 text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score}</div>
                </div>
              </div>
              {/* <div style={{ boxShadow: "0 1.5px 0 black" }} className="absolute  rounded-[50%] p-0.5 size-16 flex justify-center items-center text-[36px] genshin_font bottom-3 right-6 z-11">
                <div className="translate-y-0.25">{score}</div>
              </div> */}
            </div>

            return ""
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  }

  return <div style={{ background: "transparent", width: 548 }} className="flex flex-col gap-[106px]">
    <DeckLeftPaneCard
      player={playerTop}
      deck={deckTop}
    />
    <DeckLeftPaneCard
      player={playerBottom}
      deck={deckBottom}
    />
  </div>
}