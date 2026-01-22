'use client';

import { notFound, redirect, usePathname } from "next/navigation";
import { gameVersion, getVerLabel } from "@/utils/version";
import Link from "next/link";
import { use } from "react";
import { ServerPure, MajorPlayer, Locales } from "@/utils/types";
import { getPlayer } from "@/utils/major";
import { generateRoundStructure } from "@/utils/brackets";
import { decode } from "@/utils/decoder";
import { useTranslations } from "next-intl";
import { useMajorData } from "@/hooks/useMajorData";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { CardImageMedium } from "@/components/CardImage";
import { PlayCircleIcon } from '@heroicons/react/24/solid';

export default function MajorMatchDetail ({ params }: { params: Promise<{ locale: Locales; version: string; server: ServerPure; matchid: number }> }) {
  const { locale, version, server } = use(params);
  let { matchid } = use(params); matchid = Number(matchid);
  const pathname = usePathname()
  if(version in gameVersion.redirect) redirect(pathname.replace(version, gameVersion.redirect[version as keyof typeof gameVersion.redirect]));
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  if(majorMetadata.server.indexOf(server) < 0) notFound();

  const localCardsData = useLocalCardsData(locale)

  const t = useTranslations("MajorRecap");
  
  const serverList = useTranslatedServers();
  const serverName = serverList.find(s => s.value === server)?.label || server.toUpperCase();

  const { data, isLoading, error } = useMajorData(version, server, gameVersion.latest === version);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>

  const match = data.bracket.find(m => m.matchid === matchid);
  if(!match) return <p>Something went wrong: Can't find corresponding match</p>

  const { seeding, maxRound, rounds, games } = generateRoundStructure(data.max_players)
  if(!seeding) return <p>Something went wrong: Seeding error</p>

  const player1 = getPlayer(matchid, 1, data, games, seeding);
  const player2 = getPlayer(matchid, 2, data, games, seeding);
  if(!player1 || !player2 || data.bracket.find(m => m.matchid === matchid)?.is_bye) notFound();
  const score1 = match.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = match.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);

  const title = t("match_title", {
    version: getVerLabel(version, locale),
    server: serverName || server.toUpperCase(),
    match: matchid
  });

  document.title = `${player1.name} ${score1}–${score2} ${player2.name} | ${title}`;

  const getCharacterCards = (player: MajorPlayer, deckcodeIndex: number) => {
    const decoded = decode(player.deckcode[deckcodeIndex], "id");
    const decodedData = decoded.data;
    if(!decodedData) return [1101, 1101, 1101];
    return (decodedData).splice(0, 3) as number[]
  }

  const playerPath = `/${locale}/major/${version}/${server}/player`

  return <div className="w-[406px] md:w-[556px] mx-auto my-6">
    <h1 className="major_match_padding section_title">
      {title}
    </h1>
    <div className="major_match_row text-lg md:text-xl font-semibold">
      <div className="text-center"><Link href={`${playerPath}/${player1.seed}`} className="hover:underline">{player1.name}</Link></div>
      <div className="whitespace-nowrap">{score1} – {score2}</div>
      <div className="text-center"><Link href={`${playerPath}/${player2.seed}`} className="hover:underline">{player2.name}</Link></div>
    </div>
    {((/*BANS*/) => {
      function banDiv (matchBans: [number, number], players: [MajorPlayer, MajorPlayer]) {
        return <div className="major_match_row">
          <div className="deck_container ban left_player">
            <div>{t("banned")}</div>
            <Link href={`${playerPath}/${players[0].seed}?d=${matchBans[0]-1}`}>
              {getCharacterCards(players[0], matchBans[0]-1).map((c, i) => (
                <CardImageMedium
                  key={i}
                  cardType="characters"
                  cardId={c}
                  resize={true}
                  localCardsData={localCardsData}
                />
              ))}
            </Link>
          </div>
          <div/>
          <div className="deck_container ban right_player">
            <div>{t("banned")}</div>
            <Link href={`${playerPath}/${players[1].seed}?d=${matchBans[1]-1}`}>
              {getCharacterCards(players[1], matchBans[1]-1).map((c, i) => (
                <CardImageMedium
                  key={i}
                  cardType="characters"
                  cardId={c}
                  resize={true}
                  localCardsData={localCardsData}
                />
              ))}
            </Link>
          </div>
        </div>
      }
      return <>
        {match.bans && !match.bans.some(b => typeof b !== "number") && banDiv(match.bans, [player1, player2])}
        {match.bans2 && !match.bans2.some(b => typeof b !== "number") && banDiv(match.bans2, [player1, player2])}
      </>
    })()}
    {match.games.map((game, match_index) => <div className="major_match_row" key={match_index}>
      <div className={`deck_container left_player ${game.winner === 1 ? "win" : "lose"}`}>
        <div className="flex justify-between">
          <div className="regular_text">{t("game_x", { game: game?.game_num ?? match_index+1 })}</div>
          <div className="wl_text">
            {game.winner ? (game.winner === 1 ? t("win") : t("lose")) : t("ongoing")}
          </div>
        </div>
        <Link href={`${playerPath}/${player1.seed}?d=${game.deck_index[0]-1}`}>
          {getCharacterCards(player1, game.deck_index[0]-1).map((c, i) => (
            <CardImageMedium
              key={i}
              cardType="characters"
              cardId={c}
              resize={true}
              localCardsData={localCardsData}
            />
          ))}
        </Link>
      </div>
      <div/>
      <div className={`deck_container right_player ${game.winner === 2 ? "win" : "lose"}`}>
        <div className="flex justify-between">
          <div className="wl_text">
            {game.winner ? (game.winner === 2 ? t("win") : t("lose")) : t("ongoing")}
          </div>
          {game.vod && <a href={game.vod} className="text-[#AF7637] items-center inline" target="_blank" rel="noopener noreferrer">
            <PlayCircleIcon className="size-4.5"/> {t("watch_replay")}
          </a>}
        </div>
        <Link href={`${playerPath}/${player2.seed}?d=${game.deck_index[1]-1}`}>
          {getCharacterCards(player2, game.deck_index[1]-1).map((c, i) => (
            <CardImageMedium
              key={i}
              cardType="characters"
              cardId={c}
              resize={true}
              localCardsData={localCardsData}
            />
          ))}
        </Link>
      </div>
    </div>)}
  </div>
}