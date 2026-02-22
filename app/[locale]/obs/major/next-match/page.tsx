"use client"

import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid } from "@/hooks/useMajorData";
import { generateRoundStructure } from "@/utils/brackets";
import { getPlayer, getRoundNameKey } from "@/utils/major";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";

export default function MajorNextMatchOverlay () {
  const t = useTranslations("MajorRecap");

  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  if(!live.data || !majorMetadata.data) return "Loading";

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server
  
  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const { seeding, games } = generateRoundStructure(majorData.max_players)

  const round = games.findIndex(r => r.includes(liveMatch?.matchid || 1)) || 0

  if(!liveMatch || !seeding) notFound();

  const matchid = liveMatch.matchid

  const player1 = getPlayer(matchid, 1, majorData, games, seeding);
  const player2 = getPlayer(matchid, 2, majorData, games, seeding);
  if(!player1 || !player2 || majorData.bracket.find(m => m.matchid === matchid)?.is_bye) notFound();
  const score1 = liveMatch.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = liveMatch.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);

  return <div className="relative flex flex-row justify-center align-middle gap-4 items-center text-[30px] text-center h-40 prevent_select">
    <div className="absolute z-1 genshin_font -top-0 text-[24px] italic">{t(getRoundNameKey(games[round].length*2), { top: games[round].length*2 }).toUpperCase()}</div>
    
    <div className="flex flex-row gap-2 justify-center items-center">
      <div style={{ boxShadow: "0 1.5px 0 black" }} className="relative bg-[#fdca90] rounded-[50%] p-0.5 size-30 flex justify-center items-center z-11">
        <img src={`/major/${version}/avatar/${server}/${player1.seed}.png`} className="rounded-[50%]" />
        <div className="absolute size-20 flex justify-center items-center text-[30px] genshin_font z-11 -top-5 -left-5">
          <div className="relative">
            <img src="/game_icons/hp.png" />
            <div style={{ textShadow: "1.5px 1.5px 0 black" }} className="absolute w-20 text-white text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score1}</div>
          </div>
        </div>
      </div>

      <div className={`bg-[#fdca90] p-4 w-124 h-20 genshin_font rounded-[5rem] basic_shadow-bottom items-center justify-center flex`}>
        <div>{player1.name}</div>
      </div>
    </div>

    

    <div className="genshin_font italic text-[44px] -translate-x-1">VS</div>

    <div className="flex flex-row gap-2 justify-center items-center">
      <div className={`bg-[#fdca90] p-4 w-124 h-20 genshin_font rounded-[5rem] basic_shadow-bottom items-center justify-center flex`}>
        <div>{player2.name}</div>
      </div>
      
      <div style={{ boxShadow: "0 1.5px 0 black" }} className="relative bg-[#fdca90] rounded-[50%] p-0.5 size-30 flex justify-center items-center z-11">
        <img src={`/major/${version}/avatar/${server}/${player2.seed}.png`} className="rounded-[50%]" />
        <div className="absolute size-20 flex justify-center items-center text-[30px] genshin_font z-11 -top-5 -right-5">
          <div className="relative">
            <img src="/game_icons/hp.png" />
            <div style={{ textShadow: "1.5px 1.5px 0 black" }} className="absolute w-20 text-white text-center bottom-1/2 right-1/2 translate-x-1/2 translate-y-[calc(50%+3px)]">{score2}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
}