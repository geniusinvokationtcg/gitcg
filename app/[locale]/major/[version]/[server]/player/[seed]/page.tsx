'use client';

import { notFound, redirect, usePathname, useSearchParams } from "next/navigation";
import { gameVersion, getVerLabel } from "@/utils/version";
import { use, useState } from "react"
import { useTranslations } from "next-intl";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { useMajorData } from "@/hooks/useMajorData";
import { useCopiedPopUp } from "@/hooks/utilities";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { CardImageMedium, CardImageLarge } from "@/components/CardImage";
import { CustomButton, IndexSelector } from "@/components/Button";
import { SuccessNotification } from "@/components/PopUp";
import { ServerPure, EliminationBracketMatch, Locales } from "@/utils/types";
import { generateRoundStructure } from "@/utils/brackets";
import { getWinner, getPlayer, getRoundNameKey } from "@/utils/major";
import { decodeAndSortActionCards } from "@/utils/decoder";
import { handleCopy } from "@/utils/clipboard";
import { percentize } from "@/utils/formatting";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function MajorPlayerDetail ({ params }: { params: Promise<{ locale: Locales; version: string; server: ServerPure; seed: number }> }) {
  const { locale, version, server } = use(params);
  let { seed } = use(params); seed = Number(seed);
  const searchParams = useSearchParams();
  const d = searchParams.get("d")

  const pathname = usePathname()
  if(version in gameVersion.redirect) redirect(`${pathname.replace(version, gameVersion.redirect[version as keyof typeof gameVersion.redirect])}?d=${d}`);
  
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  if(majorMetadata.server.indexOf(server) < 0) notFound();

  const localCardsData = useLocalCardsData(locale)

  const g = useTranslations("General");
  const t = useTranslations("MajorRecap");
  
  const [deckIndex, setDeckIndex] = useState<number>(isNaN(Number(d)) ? 0 : Number(d));

  const serverList = useTranslatedServers(); 
  const serverName = serverList.find(s => s.value === server)?.label || server.toUpperCase();

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp();
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false);

  const { data, isLoading, error } = useMajorData(version, server);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>

  const player = data.players.find(p => p.seed === seed)
  if(!player) notFound()
  
  const title = t("player_title", {
    version: getVerLabel(version, locale),
    server: serverName || server.toUpperCase(),
    seed: seed
  })
  
  document.title = `${player.name} | ${title}`
  
  const { seeding, maxRound, rounds, games } = generateRoundStructure(data.max_players)

  let playedMatches: EliminationBracketMatch[] = []
  if(seeding){
    let matchIndex = seeding.findIndex(m => m.includes(player.seed))
    for(let r of games){
      const match = data.bracket[ r[matchIndex]-1 ]
      playedMatches.push(match)

      const winner = getWinner(match.matchid, data)
      const winnerData = getPlayer(match.matchid, winner, data, games, seeding)
      if(!winnerData || winnerData.seed !== player.seed) break
      matchIndex = Math.floor(matchIndex/2)
    }
  }

  const decklists = player.deckcode.map(code => {
    const decoded = decodeAndSortActionCards(code)
    const characterCards = decoded.splice(0, 3)
    return {
      deckcode: code,
      character_cards: characterCards,
      action_cards: decoded
    }
  })
  // const decoded = decodeAndSortActionCards(player.deckcode[deckIndex])
  // const characterCards = decoded.splice(0, 3)
  // const actionCards = decoded

  return <div className="showcase_page_margin">
    <h1 className="deck_showcase_padding section_title">
      {title}
    </h1>
    <h1 className="deck_showcase_padding section_title font-semibold">
      {player.name}
    </h1>
    {player.avatar && <div className="deck_showcase_padding flex justify-center">
        <img src={player.avatar === "default" ? `/major/${version}/avatar/${server}/${player.seed}.png` : player.avatar}
          className="avatar"
          alt="Avatar"
        />
    </div>}
    {playedMatches.length > 0 && <div className="deck_showcase_padding stat_showcase">
      {(() => {
        let ok = true
        if(!seeding) return
        const gameCount = playedMatches.reduce((a, match) => a + match.games.length, 0)
        const winCount = playedMatches.reduce((a, match) => a + match.games.filter(g => {
          const player1 = getPlayer(match.matchid, 1, data, games, seeding)
          if(!player1){ ok = false; return }
          const currentPlayerIndexInMatch = player1.seed === player.seed ? 1 : 2
          return g.winner === currentPlayerIndexInMatch
        }).length, 0)
        const winRate = gameCount === 0 ? 0 : winCount/gameCount
        const bestTop = playedMatches.at(-1)!.top
        if(ok) return <>
          <div>
            <div>{t("game_count")}</div>
            <div>{gameCount}</div>
          </div>
          <div>
            <div>{t("win_count")}</div>
            <div>{winCount}</div>
          </div>
          <div>
            <div>{t("win_rate")}</div>
            <div>{percentize(winRate, locale)}</div>
          </div>
          <div>
            <div>{t("best_advancement")}</div>
            <div>{t(getRoundNameKey(bestTop), { top: bestTop })}</div>
          </div>
        </>
      })()}
    </div>}
    <div className="deck_showcase_padding section_title">{g("decklist")}</div>
    <IndexSelector
      currentIndex={deckIndex+1}
      setIndexFn={setDeckIndex}
      maxIndex={player.deckcode.length}
    />
    <div className="deck_showcase_padding character_cards_large">
      {decklists[deckIndex].character_cards.map((c, index) => (
        <CardImageLarge
          key={index}
          cardType="characters"
          cardId={c}
          localCardsData={localCardsData}
        />
      ))}
    </div>
    
    {seeding && (() => {
      let ok = true
      let a = {
        game_count: 0,
        win_count: 0,
        ban_count: 0
      }
      for(let m of playedMatches){
        const player1 = getPlayer(m.matchid, 1, data, games, seeding)
        if(!player1){ ok = false; return }
        const currentPlayerIndex = player1.seed === player.seed ? 1 : 2

        if(m.bans) if(m.bans[currentPlayerIndex-1] === deckIndex+1) a.ban_count++
        m.games.forEach(g => {
          if(g.deck_index[currentPlayerIndex-1] === deckIndex+1) a.game_count++
          else return
          if(g.winner === currentPlayerIndex) a.win_count++
        })
      }
      if(ok) return <div className="deck_showcase_padding stat_showcase">
        <div>
          <div>{t("game_count")}</div>
          <div>{a.game_count}</div>
        </div>
        <div>
          <div>{t("win_count")}</div>
          <div>{a.win_count}</div>
        </div>
        <div>
          <div>{t("win_rate")}</div>
          <div>{percentize(a.game_count === 0 ? 0 : a.win_count/a.game_count, locale)}</div>
        </div>
        <div>
          <div>{t("ban_count")}</div>
          <div>{a.ban_count}</div>
        </div>
      </div>
    })()}
    
    <div className="deck_showcase_padding flex gap-1.5 justify-center flex-wrap">
      {decklists[deckIndex].action_cards.map((c, index) => (
        <CardImageMedium
          key={index}
          cardType="actions"
          cardId={c}
          localCardsData={localCardsData}
        />
      ))}
    </div>
    { showDeckcode && <div className={"mx-3 mt-1.5 text-center monospaced select-all break-all"}>
      {decklists[deckIndex].deckcode}
    </div> }
    <div className="px-3 pt-1.5 flex justify-center mx-auto gap-1.5">
      <CustomButton
        buttonText={g("copy_deckcode")}
        onClick={() => handleCopy(decklists[deckIndex].deckcode, copiedPopUpTrigger)}
      />
      <CustomButton
        buttonText={showDeckcode ? g("hide_deckcode") : g("show_deckcode")}
        onClick={() => setShowDeckcode(!showDeckcode)}
      />
      <SuccessNotification show={showNotification} text={g("copied")} />
    </div>
  </div>
}