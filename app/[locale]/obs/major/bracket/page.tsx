"use client"

import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid } from "@/hooks/useMajorData";
import { generateRoundStructure } from "@/utils/brackets";
import { getPlayer, getRoundNameKey } from "@/utils/major";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";

export default function BracketOverlay () {
  const t = useTranslations("MajorRecap");
  
  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  if(!live.data || !majorMetadata.data) return "Loading";

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server
  
  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const { seeding, maxRound, rounds, games } = generateRoundStructure(majorData.max_players)

  if(!liveMatch || !seeding) notFound();
  
  return <div className="overflow-auto text-lg flex flex-col justify-center text-[#6C3C16]">
    <div className="flex flex-row gap-x-12 mx-auto mb-4">
      {rounds.map(round => <h2 className="font-bold mb-2 min-w-54 text-center" key={round}>{
        t(getRoundNameKey(games[round-1].length*2), { top: games[round-1].length*2 })
      }</h2>)}
    </div>
    <div
      className="flex flex-row gap-x-12 mx-auto"
      style={{ gridTemplateColumns: `repeat(${maxRound}, auto)` }}
    >
      {rounds.map((round, index) => {
        const data = majorData
        
        const top = 2**rounds.at(-(index+1))!
        const roundMatches = data.bracket.filter(m => m.top === top)
        const matchMinHeight = 16.5*(2**(index)) + 8*(2**(index)-1);
        return <div key={round} className="flex flex-col items-center gap-8 relative">
          {games[index].map((matchid, i) => {
            const match = roundMatches.find(m => m.matchid === matchid);
            //if(matchid === 5) console.log(JSON.stringify(match))
            const playerData1 = getPlayer(match?.matchid, 1, data, games, seeding)
            const playerData2 = getPlayer(match?.matchid, 2, data, games, seeding)
            const score1 = match?.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
            const score2 = match?.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);
            const minWins = ((match?.best_of || NaN)+1)/2
            const winner = score1 === minWins ? playerData1 : (score2 === minWins ? playerData2 : null)

            const isMatchWinner = (player: 1 | 2) => {
              let mountPlayerData = player === 1 ? playerData1 : playerData2;
              
              if(match?.enforce_winner === player) return true;

              if(!mountPlayerData) return false;

              if(mountPlayerData.name === winner?.name) return true;
              if(match?.is_bye) return true;

              return false;
            }
                        
            return <div
              key={matchid}
              className={`relative min-h-${matchMinHeight} flex items-center`}
              style={{
                height: `${(matchMinHeight)*4}px`,
              }}
            >
              {/* Connectors (first part excludes last round; second part excludes first round) */}
              {round < maxRound && <>
                <div className={`absolute top-[calc(50%-1px)] left-full h-0 w-6 border-2 border-l-0 border-[#fad38c] rounded-r-2xl ${i % 2 === 0 ? "" : "hidden"}`}
                style={{
                  height: `${(matchMinHeight+8.5)*4}px`,
                }}
                />
                <div className={`absolute left-[calc(100%+24px)] h-0 w-6 border-t-2 border-[#fad38c] ${i % 2 === 0 ? "" : "hidden"}`}
                  style={{
                    top: `${matchMinHeight*4+15}px`
                  }}
                />
              </>}

              <div className="relative">
                <div className={`block ${match?.is_bye ? "cursor-default" : ""}`}>
                  <div className={`w-54 relative z-10 flex flex-col gap-0.5`} >
                    {/* <div className="absolute top-[-20px] text-gray-500 text-xs">
                      {
                        t("match_x", {match: matchid}) +
                        (match && match?.best_of ? ` – ${t("best_of_x", {x: match.best_of, min_w: (match.best_of+1)/2})}` : "")
                      }
                    </div> */}
                    <div className="flex flex-row gap-0.5 justify-between h-10">
                      <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full bg-[#fad38c] p-4 rounded-3xl ${isMatchWinner(1) ? "font-bold" : "font-semibold"} ${!playerData1 && match?.is_bye ? "italic" : ""}`}>
                        {playerData1?.name || (match?.is_bye ? t("bye") : "")}
                      </span>
                      <span className={`py-2 bg-[#fad38c] rounded-[50%] min-w-10 flex justify-center items-center ${isMatchWinner(1) ? "font-bold" : "font-semibold"}`}>
                        {playerData1 && !match?.is_bye && typeof score1 === "number" ? score1 : ""}
                      </span>
                    </div>
                    <div className="flex flex-row gap-0.5 justify-between h-10">
                      <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full bg-[#fad38c] p-4 rounded-3xl ${isMatchWinner(2) ? "font-bold" : "font-semibold"} ${!playerData2 && match?.is_bye ? "italic" : ""}`}>
                        {playerData2?.name || (match?.is_bye ? t("bye") : "")}
                      </span>
                      <span className={`py-2 bg-[#fad38c] rounded-[50%] min-w-10 flex justify-center items-center ${isMatchWinner(2) ? "font-bold" : "font-semibold"}`}>
                        {playerData2 && !match?.is_bye && typeof score2 === "number" ? score2 : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          })}
        </div>
      })}
    </div>
  </div>
}