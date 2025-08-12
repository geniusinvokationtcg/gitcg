'use client';

import { notFound } from "next/navigation";
import gameVersion from "@/game-version.json"
import Link from "next/link";
import { use } from "react";
import { ServerPure, MajorPlayer } from "@/utils/types";
import { getPlayer } from "@/utils/major";
import { generateSeeding } from "@/utils/brackets";
import { decode } from "@/utils/decoder";
import { useTranslations } from "next-intl";
import { useMajorData } from "@/hooks/useMajorData";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { CardImageMedium } from "@/components/CardImage";
import { PlayCircleIcon } from '@heroicons/react/24/solid';

export default function MajorMatchDetail ({ params }: { params: Promise<{ locale: string; version: string; server: ServerPure; matchid: number }> }) {
  const { locale, version, server } = use(params);
  let { matchid } = use(params); matchid = Number(matchid);
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  if(majorMetadata.server.indexOf(server) < 0) notFound();

  const t = useTranslations("MajorRecap");
  
  const serverList = useTranslatedServers();
  const serverName = serverList.find(s => s.value === server)?.label || server.toUpperCase();

  const { data, isLoading, error } = useMajorData(version, server);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>

  const match = data.bracket.find(m => m.matchid === matchid);
  if(!match) return <p>Something went wrong: Can't find corresponding match</p>

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

  const player1 = getPlayer(matchid, 1, data, games, seedingData);
  const player2 = getPlayer(matchid, 2, data, games, seedingData);
  if(!player1 || !player2 || player1.name === "BYE" || player2.name === "BYE") notFound();
  const score1 = match.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = match.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);

  const title = t("match_title", {
    version: version,
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

  return <div className="w-[406px] md:w-[556px] mx-auto pb-3">
    <h1 className="major_match_padding section_title">
      {title}
    </h1>
    <div className="major_match_row text-lg md:text-xl font-semibold">
      <div className="text-center"><Link href={`${playerPath}/${player1.seed}`} className="hover:underline">{player1.name}</Link></div>
      <div className="whitespace-nowrap">{score1} – {score2}</div>
      <div className="text-center"><Link href={`${playerPath}/${player2.seed}`} className="hover:underline">{player2.name}</Link></div>
    </div>
    {match.bans && <div className="major_match_row">
      <div className="deck_container ban left_player">
        <div>{t("banned")}</div>
        <Link href={`${playerPath}/${player1.seed}?d=${match.bans[0]-1}`}>
          {getCharacterCards(player1, match.bans[0]-1).map((c, i) => (
            <CardImageMedium
              key={i}
              cardType="characters"
              cardId={c}
              resize={true}
              locale={locale}
            />
          ))}
        </Link>
      </div>
      <div/>
      <div className="deck_container ban right_player">
        <div>{t("banned")}</div>
        <Link href={`${playerPath}/${player2.seed}?d=${match.bans[1]-1}`}>
          {getCharacterCards(player2, match.bans[1]-1).map((c, i) => (
            <CardImageMedium
              key={i}
              cardType="characters"
              cardId={c}
              resize={true}
              locale={locale}
            />
          ))}
        </Link>
      </div>
    </div>}
    {match.games.map((game, match_index) => <div className="major_match_row" key={match_index}>
      <div className={`deck_container left_player ${game.winner === 1 ? "win" : "lose"}`}>
        <div className="flex justify-between">
          <div className="regular_text">{t("game_x", { game: match_index+1 })}</div>
          <div className="wl_text">
            {game.winner === 1 ? t("win") : t("lose")}
          </div>
        </div>
        <Link href={`${playerPath}/${player1.seed}?d=${game.deck_index[0]-1}`}>
          {getCharacterCards(player1, game.deck_index[0]-1).map((c, i) => (
            <CardImageMedium
              key={i}
              cardType="characters"
              cardId={c}
              resize={true}
              locale={locale}
            />
          ))}
        </Link>
      </div>
      <div/>
      <div className={`deck_container right_player ${game.winner === 2 ? "win" : "lose"}`}>
        <div className="flex justify-between">
          <div className="wl_text">
            {game.winner === 2 ? t("win") : t("lose")}
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
              locale={locale}
            />
          ))}
        </Link>
      </div>
    </div>)}
  </div>
}