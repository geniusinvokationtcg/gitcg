'use client';

import Link from "next/link"
import { redirect, notFound } from "next/navigation";
import gameVersion from "@/game-version.json"
import { usePageTitle } from "@/hooks/usePageTitle";
import { use, useState } from "react";
import { useMajorData } from "@/hooks/useMajorData";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { generateSeeding } from "@/utils/brackets";
import { getPlayer } from "@/utils/major"
import { useTranslations } from "next-intl";
import { CustomSelect } from "@/components/Dropdown";
import { ServerPure } from "@/utils/types";

export default function MajorRecap ({ params }: { params: Promise<{ locale: string; version: string }> }) {
  const { locale, version } = use(params);
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  const t = useTranslations("MajorRecap");
  usePageTitle( t("title", { version: version } ));

  const [server, setServer] = useState<ServerPure>(majorMetadata.server[0] as ServerPure);
  const serverList = useTranslatedServers();

  const { data, isLoading, error } = useMajorData(version, server);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>
  
  const seeding = generateSeeding(data.max_players);
  const seedingData = seeding.data;
  if(!seedingData) return <p>Something went wrong: {seeding.error.message}</p>
  
  const maxRound = Math.ceil(Math.log2(data.max_players));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  const games: number[][] = [];
  rounds.map(round => {
    const n = data.max_players/(2**round)
    if(games.length === 0) {
      const g = Array.from({ length: n }, (_, i) => i + 1);
      games.push(g);
    }
    else {
      const g = Array.from({ length: n }, (_, i) => i + 1 + games.at(-1)!.at(-1)!);
      games.push(g);
    }
  })

  return <div className="min-w-screen p-6 mx-auto">
    <div className="mb-6 dropdowns_container gap-2">
      <CustomSelect
        options={gameVersion.major.map(i => ({ value: i.version, label: i.version }))}
        value={version}
        onChange={(newVersion: string) => { redirect(`/${locale}/major/${newVersion}`) }}
      />
      <CustomSelect
        options={majorMetadata.server.map(s => ({value: s, label: serverList.find(list => list.value === s)?.label || s}) )}
        value={serverList.find(s => s.value === server)?.label || server}
        onChange={(newServer) => setServer(newServer)}
      />
    </div>
    <div className="overflow-auto text-sm flex flex-col justify-center">
      <div className="flex flex-row gap-x-12 mx-auto mb-2">
        {rounds.map(round => <h2 className="font-semibold mb-2 min-w-50 text-center" key={round}>{t("round_x", { round: round})}</h2>)}
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
              if(matchid === 5) console.log(JSON.stringify(match))
              const playerData1 = getPlayer(match?.matchid, 1, data, games, seedingData)
              const playerData2 = getPlayer(match?.matchid, 2, data, games, seedingData)
              const score1 = match?.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
              const score2 = match?.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);
              const minWins = ((match?.best_of || NaN)+1)/2
              const winner = score1 === minWins ? playerData1 : (score2 === minWins ? playerData2 : null)
                          
              return <div
                key={matchid}
                className={`relative min-h-${matchMinHeight} flex items-center`}
                style={{
                  height: `${(matchMinHeight)*4}px`,
                }}
              >
                {/* Connectors (first part excludes last round; second part excludes first round) */}
                {round < maxRound && (
                  <div className={`absolute top-[calc(50%-1px)] left-full h-0 w-6 border-2 border-l-0 border-gray-300 ${i % 2 === 0 ? "" : "hidden"}`}
                  style={{
                    height: `${(matchMinHeight+8.5)*4}px`,
                  }}
                  />
                )}
                {round > 1 && (
                  <div className="absolute top-[calc(50%-1px)] right-full h-0 w-6 border-t-2 border-gray-300" />
                )}
                <Link href={`/${locale}/major/${version}/${server}/match/${matchid}`} className="block">
                <div className="group w-50 relative z-10 flex flex-col gap-0.5 cursor-pointer" >
                  <div className="flex flex-row gap-0.5 justify-between h-8">
                    <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full p-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 ${playerData1 ? (playerData1.name === winner?.name ? "font-semibold" : "") : ""}`}>
                      {playerData1?.name || ""}
                    </span>
                    <span className={`py-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 min-w-8 flex justify-center items-center ${playerData1 ? (playerData1.name === winner?.name ? "font-semibold" : "") : ""}`}>
                      {typeof score1 === "number" ? score1 : ""}
                    </span>
                  </div>
                  <div className="flex flex-row gap-0.5 justify-between h-8">
                    <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center w-full p-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 ${playerData2 ? (playerData2.name === winner?.name ? "font-semibold" : "") : ""}`}>
                      {playerData2?.name || ""}
                    </span>
                    <span className={`py-2 bg-gray-200 group-hover:bg-gray-300 transition-all duration-200 min-w-8 flex justify-center items-center ${playerData2 ? (playerData2.name === winner?.name ? "font-semibold" : "") : ""}`}>
                      {typeof score2 === "number" ? score2 : ""}
                    </span>
                  </div>
                </div>
                </Link>
                
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