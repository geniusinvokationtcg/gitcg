'use client';

import Link from "next/link"
import { redirect, notFound, usePathname } from "next/navigation";
import { gameVersion, getVerLabel } from "@/utils/version";
import { lazy, useState, Suspense } from "react";
import { useMajorData } from "@/hooks/useMajorData";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { generateRoundStructure } from "@/utils/brackets";
import { getPlayer, getRoundNameKey } from "@/utils/major"
import { useTranslations } from "next-intl";
import { CustomSelect } from "@/components/Dropdown";
import { ServerPure } from "@/utils/types";
import { CustomButton } from "@/components/Button";
import { MajorRecapParams } from "./page";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const Tooltip = lazy(() =>
  import("@/components/Tooltip").then(module => ({ default: module.Tooltip }))
);

export default function MajorRecapClient ({ params }: { params: MajorRecapParams }) {
  const { locale, version } = params
  const pathname = usePathname()
  if(version in gameVersion.redirect) redirect(pathname.replace(version, gameVersion.redirect[version as keyof typeof gameVersion.redirect]));
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  const t = useTranslations("MajorRecap");

  const [server, setServer] = useState<ServerPure>(majorMetadata.server[0] as ServerPure);
  const serverList = useTranslatedServers();

  const { data, isLoading, error } = useMajorData(version, server, gameVersion.latest === version);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>
  
  const { seeding, maxRound, rounds, games } = generateRoundStructure(data.max_players)
  if(!seeding) return <p>Something went wrong: Seeding error</p>

  return <div className="min-w-screen p-6 mx-auto">
    <div className="mb-6 dropdowns_container gap-2">
      <CustomSelect
        options={gameVersion.major.filter(i => !i.start || new Date(i.start) <= new Date()).map(i => ({ value: i.version, label: getVerLabel(i.version, locale) }))}
        value={getVerLabel(version, locale)}
        onChange={(newVersion: string) => { redirect(`/${locale}/major/${newVersion}`) }}
      />
      <CustomSelect
        options={majorMetadata.server.map(s => ({value: s, label: serverList.find(list => list.value === s)?.label || s}) )}
        value={serverList.find(s => s.value === server)?.label || server}
        onChange={(newServer) => setServer(newServer)}
      />
      {data.vod && <Link href={data.vod} target="_block" rel="noopener noreferrer">
        <CustomButton
          buttonText={t("watch_whole_replay")}
          textSize="xs"
        />
      </Link>}
    </div>
    <div className="overflow-auto text-sm flex flex-col justify-center">
      <div className="flex flex-row gap-x-12 mx-auto mb-6">
        {rounds.map(round => <h2 className="font-semibold mb-2 min-w-50 text-center" key={round}>{
          t(getRoundNameKey(games[round-1].length*2), { top: games[round-1].length*2 })
        }</h2>)}
      </div>
      <div
        className="flex flex-row gap-x-12 mx-auto"
        style={{ gridTemplateColumns: `repeat(${maxRound}, auto)` }}
      >
        {rounds.map((round, index) => {
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
                  <div className={`absolute top-[calc(50%-1px)] left-full h-0 w-6 border-2 border-l-0 border-gray-300 ${i % 2 === 0 ? "" : "hidden"}`}
                  style={{
                    height: `${(matchMinHeight+8.5)*4}px`,
                  }}
                  />
                  <div className={`absolute left-[calc(100%+24px)] h-0 w-6 border-t-2 border-gray-300 ${i % 2 === 0 ? "" : "hidden"}`}
                    style={{
                      top: `${matchMinHeight*4+15}px`
                    }}
                  />
                </>}
                {/*round > 1 && (
                  <div className="absolute top-[calc(50%-1px)] right-full h-0 w-6 border-t-2 border-gray-300" />
                )*/}

                <Suspense><div className="relative">
                  {match?.enforce_winner && match?.enforce_reason && match.enforce_reason !== "unspecified" &&
                    <div className="absolute z-11 -top-1/3 right-1.5">
                      <Tooltip position="bottom" content={
                        <div className="text-xs text-center w-30">{
                          t(`enforce_reason.${match.enforce_reason}`, { player: (isMatchWinner(1) ? playerData2?.name : playerData1?.name) ?? "" })
                        }</div>
                      }>
                        <InformationCircleIcon className="size-5 text-gray-500"/>
                      </Tooltip>
                    </div>
                  }
                  <Link href={match?.is_bye ? "" : `/${locale}/major/${version}/${server}/match/${matchid}`} className={`block ${match?.is_bye ? "cursor-default" : ""}`}>
                    <div className={`group w-50 relative z-10 flex flex-col gap-0.5`} >
                      <div className="absolute top-[-20px] text-gray-500 text-xs group-hover:text-gray-800 transition-all duration-200">
                        {
                          t("match_x", {match: matchid}) +
                          (match && match?.best_of ? ` – ${t("best_of_x", {x: match.best_of, min_w: (match.best_of+1)/2})}` : "")
                        }
                      </div>
                      <div className="flex flex-row gap-0.5 justify-between h-8">
                        <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full p-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 ${isMatchWinner(1) ? "font-semibold" : ""} ${!playerData1 && match?.is_bye ? "italic" : ""}`}>
                          {playerData1?.name || (match?.is_bye ? "BYE" : "")}
                        </span>
                        <span className={`py-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 min-w-8 flex justify-center items-center ${isMatchWinner(1) ? "font-semibold" : ""}`}>
                          {playerData1 && !match?.is_bye && typeof score1 === "number" ? score1 : ""}
                        </span>
                      </div>
                      <div className="flex flex-row gap-0.5 justify-between h-8">
                        <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full p-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 ${isMatchWinner(2) ? "font-semibold" : ""} ${!playerData2 && match?.is_bye ? "italic" : ""}`}>
                          {playerData2?.name || (match?.is_bye ? "BYE" : "")}
                        </span>
                        <span className={`py-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 min-w-8 flex justify-center items-center ${isMatchWinner(2) ? "font-semibold" : ""}`}>
                          {playerData2 && !match?.is_bye && typeof score2 === "number" ? score2 : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div></Suspense>
                
              </div>
            })}
          </div>
        })}
      </div>
    </div>
  </div>
}

// {/* Vertical line connecting matches */}
// {round < maxRound && (
//   <div
//     className={`absolute left-full top-1/2 w-0 border-1 border-gray-300 ${i % 2 === 0 ? "" : "hidden"}`}
//     style={{
//       height: `${(matchMinHeight+8.5)*4}px`,
//       transform: `translateX(1.5rem)`,
//     }}
//   />
// )}