'use client'

import cardsData from "@/cards.json";
import { gameVersion, getVerLabel } from "@/utils/version";
import { duelistRecordUrl, prefixStatusRegEx, weeklyMatchdataHeader } from "@/utils/vars";
import { notFound, redirect } from 'next/navigation';
import { use, useEffect, useMemo, useState } from "react";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { useQuery } from "@tanstack/react-query";
import { parseCSVIgnoreErr } from "@/utils/csvParse";
import { DuelistRecord, Locales, MatchDataOfSpecific, OpponentData, Server, SortingKey } from "@/utils/types";
import { CustomSelect } from "@/components/Dropdown";
import { useTranslations } from "next-intl";
import { useWeeklyData } from "@/hooks/useWeeklyData";
import { decode, decodeAndSortActionCards } from "@/utils/decoder";
import { CustomButton, IndexSelector } from "@/components/Button";
import { CardImageLarge, CardImageMedium } from "@/components/CardImage";
import { useCopiedPopUp } from "@/hooks/utilities";
import { SuccessNotification } from "@/components/PopUp";
import { handleCopy } from "@/utils/clipboard";
import { percentize } from "@/utils/formatting";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { getCardIdByName, getCardName } from "@/utils/cards";
import { useSortTable } from "@/hooks/useSortTable";
import { ColumnHeaderWithSorter, LineupShowcaseForTable, NoDataAvailable } from "@/components/Table";

export default function WeeklyPlayerPage ({ params }: { params: Promise<{ locale: Locales; version: string; playerid: number }> }) {
  const { locale, version } = use(params)
  let { playerid } = use(params); playerid = Number(playerid)
  if(gameVersion.available.indexOf(version) < 0) notFound();

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp();
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false);

  const g = useTranslations("General")
  const t = useTranslations("DeckShowcasePage")
  const h = useTranslations("WeeklyStatistic.tableHeader")
  const hNoBreak = (key: string) => h.rich(key, {break: () => ""})

  const DRQuery = useQuery({
    queryKey: ["duelist_record"],
    queryFn: () => parseCSVIgnoreErr<DuelistRecord>(duelistRecordUrl, weeklyMatchdataHeader)
  })

  const localCardsData = useLocalCardsData(locale)

  const { parsedData, isLoading, error } = useWeeklyData(version);

  const [server, setServer] = useState<Server>("all");
  const serverList = useTranslatedServers();

  const {sortKey, sortAsc, handleSort} = useSortTable<OpponentData>();
  const tableHeader = [
    { key: "opponent" },
    { key: "game_count" },
    { key: "win_count" },
    { key: "win_rate" },
    { key: "tie_count" }
  ].map(col => {
    return {...col, title: t.rich(`tableHeader.${col.key}`, { break: () => ""})}
  });

  const dataByPlayer = useMemo(() => {
    const seen: MatchDataOfSpecific[] = []
    parsedData.forEach(row => {
      const matchDetail = {
        isDrop: row.isDrop,
        isBye: row.isBye,
        isTie: row.isTie,
        isIncluded: row.isIncluded,
        isMirror: row.isMirror,
        server: row.server,
        matchNum: row.matchNum,
        week: row.week,
        game: row.game
      }
      if(row.playerid1 === playerid) seen.push({
        deckcode: row.deckcode1,
        cardsId: decodeAndSortActionCards(row.deckcode1).join("|"),
        opponent: row.characters2,
        opponent_playerid: row.playerid2,
        score: row.score1,
        ...matchDetail
      })
      if(row.playerid2 === playerid) seen.push({
        deckcode: row.deckcode2,
        cardsId: decodeAndSortActionCards(row.deckcode2).join("|"),
        opponent: row.characters1,
        opponent_playerid: row.playerid1,
        score: row.score2,
        ...matchDetail
      })
    })
    return seen
  }, [parsedData, playerid])

  const uniqueCardsId = useMemo(() => {
    const seen = new Map<string, { cardsId: string, deckcode: string, score: number }>();
    dataByPlayer.forEach(row => {
      const key = row.cardsId;
      const existing = seen.get(key);
      seen.set(key, {
        cardsId: key,
        deckcode: row.deckcode,
        score: existing ? (existing.score + row.score) : row.score
      })
    })
    return Array.from(seen.values()).filter(row => {
      const cardsId = row.cardsId.split("|");
      return (cardsId.length === 33) && !(
        cardsId.some(str => isNaN(Number(str)) )
      );
    });
  }, [dataByPlayer])

  const [deckIndex, setDeckIndex] = useState<number>(0);
  const [characterCards, setCharacterCards] = useState<number[]>([]);
  const [actionCards, setActionCards] = useState<number[]>([]);
  const [deckcode, setDeckcode] = useState<string>("");
  useEffect(() => {
    if(isLoading) return;
    if(dataByPlayer.length === 0) return;
    const cardsId = uniqueCardsId[deckIndex].cardsId.split("|").map(str => +str);
    setCharacterCards(cardsId.slice(0, 3));
    setActionCards(cardsId.slice(3));
    setDeckcode(uniqueCardsId[deckIndex].deckcode)
  }, [deckIndex, uniqueCardsId])

  
  const playerStats = useMemo(() => computeStats(dataByPlayer), [dataByPlayer])
  const deckStats = useMemo(() => computeStats(dataByPlayer.filter(m => m.cardsId === uniqueCardsId[deckIndex].cardsId)), [dataByPlayer, uniqueCardsId, deckIndex])


  const characters = characterCards
    .map(c => getCardName(c, cardsData))
    .toSorted((a,b) => a.localeCompare(b))
    .join("\\\\");
  const dataByPlayerByDeck = useMemo(() => dataByPlayer.filter(m => m.cardsId === uniqueCardsId[deckIndex].cardsId && m.isIncluded), [dataByPlayer, deckIndex, uniqueCardsId])
  const uniqueOpponentCharacters: OpponentData[] = useMemo(() => {
    const byServer = server === "all" ? dataByPlayerByDeck : dataByPlayerByDeck.filter(row => row.server === server.toUpperCase());
    const opponents = byServer.map(row => row.opponent);
    return [...new Set(opponents)].filter(opp => opp !== "").map(opp => {
      const opponentDeckcode = parsedData.find(row => row.characters1 === opp && row.characters2 === characters)?.deckcode1
        || parsedData.find(row => row.characters2 === opp && row.characters1 === characters)?.deckcode2
        || "";
      const decodedOpponentCardNames = decode(opponentDeckcode, "name").data || [];

      if(decodedOpponentCardNames.length < 3) return null

      const games = byServer.filter(row => row.opponent === opp);
      const wins = games.filter(row => row.score === 1);
      const ties = games.filter(row => row.isTie);
      return {
        character1: decodedOpponentCardNames[0]?.toString() || "",
        character2: decodedOpponentCardNames[1]?.toString() || "",
        character3: decodedOpponentCardNames[2]?.toString() || "",
        charactersId: decodedOpponentCardNames.slice(0, 3).map(c => getCardIdByName(c.toString(), "characters")),
        game_count: games.length,
        win_count: wins.length,
        win_rate: wins.length / games.length || 0,
        tie_count: ties.length
      }
    }).filter(row => row !== null).sort((a,b) => {
      const keys: SortingKey<OpponentData>[] = [
        {key: "win_count", isAscending: false},
        {key: "win_rate", isAscending: false},
        {key: "tie_count", isAscending: false},
        {key: "game_count", isAscending: false}
      ];
      if(sortKey) keys.unshift({key: sortKey, isAscending: sortAsc});
      for(const row of keys) {
        const key = row.key;
        const aValue = a[key];
        const bValue = b[key];
        let diff = 0;
        if(typeof aValue === "number" && typeof bValue === "number") diff = aValue - bValue;
        if(typeof aValue === "string" && typeof bValue === "string") diff = aValue.localeCompare(bValue);
        if(diff !== 0) return row.isAscending ? diff : -diff;
      };
      return 0; 
    })
  }, [dataByPlayerByDeck, server, characters, sortKey, sortAsc])

  return <div className="showcase_page_margin">
    <div className="deck_showcase_padding gap-2 dropdowns_container">
      <CustomSelect
        options={gameVersion.available.toReversed().map(v => ({ value: v, label: getVerLabel(v, locale) }))}
        value={getVerLabel(version, locale)}
        onChange={(newVersion) => redirect(`/${locale}/weekly/${newVersion}/player/${playerid}`)}
      />
    </div>
    <h1 className="deck_showcase_padding section_title">
      {t("player_page_title", { version: getVerLabel(version, locale) })}
    </h1>
    <h1 className="deck_showcase_padding section_title font-semibold">
      {DRQuery.isLoading ? g("loading") : DRQuery.data?.find(p => p.playerid === playerid)?.handle_display.replace(prefixStatusRegEx, "")}
    </h1>
    {dataByPlayer.length === 0 ? <NoDataAvailable/> : <>
      <div className="deck_showcase_padding stat_showcase">
        <div>
          <div>{hNoBreak("weekly_participation")}</div>
          <div>{playerStats.weekly_participation}</div>
        </div>
        <div>
          <div>{hNoBreak("best_result")}</div>
          <div>{`${playerStats.bestW}–${playerStats.bestT}–${playerStats.bestL}`}</div>
        </div>
        <div>
          <div>{hNoBreak("rate_top_deck")}</div>
          <div>{percentize(playerStats.rate_top_deck, locale)}</div>
        </div>
        <div>
          <div>{hNoBreak("game_count")}</div>
          <div>{playerStats.game_count}</div>
        </div>
        <div>
          <div>{hNoBreak("win_count")}</div>
          <div>{playerStats.win_count}</div>
        </div>
        <div>
          <div>{hNoBreak("win_rate")}</div>
          <div>{percentize(playerStats.win_rate, locale)}</div>
        </div>
        <div>
          <div>{hNoBreak("tie_count")}</div>
          <div>{playerStats.tie_count}</div>
        </div>
      </div>
      <div className="deck_showcase_padding section_title">{g("decklist")}</div>
      <IndexSelector
        currentIndex={deckIndex+1}
        setIndexFn={setDeckIndex}
        maxIndex={uniqueCardsId.length}
      />
      <div className="deck_showcase_padding character_cards_large">
        {characterCards.map((c, index) => (
          <CardImageLarge
            key={index}
            cardType="characters"
            cardId={c}
            localCardsData={localCardsData}
          />
        ))}
      </div>
      <div className="deck_showcase_padding stat_showcase">
        <div>
          <div>{hNoBreak("weekly_participation")}</div>
          <div>{deckStats.weekly_participation}</div>
        </div>
        <div>
          <div>{hNoBreak("best_result")}</div>
          <div>{`${deckStats.bestW}–${deckStats.bestT}–${deckStats.bestL}`}</div>
        </div>
        <div>
          <div>{hNoBreak("rate_top_deck")}</div>
          <div>{percentize(deckStats.rate_top_deck, locale)}</div>
        </div>
        <div>
          <div>{hNoBreak("game_count")}</div>
          <div>{deckStats.game_count}</div>
        </div>
        <div>
          <div>{hNoBreak("win_count")}</div>
          <div>{deckStats.win_count}</div>
        </div>
        <div>
          <div>{hNoBreak("win_rate")}</div>
          <div>{percentize(deckStats.win_rate, locale)}</div>
        </div>
        <div>
          <div>{hNoBreak("tie_count")}</div>
          <div>{deckStats.tie_count}</div>
        </div>
      </div>
      <div className="deck_showcase_padding flex gap-1.5 justify-center flex-wrap">
        {actionCards.map((c, index) => (
          <CardImageMedium
            key={index}
            cardType="actions"
            cardId={c}
            localCardsData={localCardsData}
          />
        ))}
      </div>
      { showDeckcode && <div className={"mx-3 mt-1.5 text-center monospaced select-all break-all"}>
        {deckcode}
      </div> }
      <div className="px-3 pt-1.5 flex flex-wrap justify-center mx-auto gap-1.5">
        <CustomButton
          buttonText={g("copy_deckcode")}
          onClick={() => handleCopy(deckcode, copiedPopUpTrigger)}
        />
        <CustomButton
          buttonText={showDeckcode ? g("hide_deckcode") : g("show_deckcode")}
          onClick={() => setShowDeckcode(!showDeckcode)}
        />
        <SuccessNotification show={showNotification} text={g("copied")} />
        <CustomButton
          buttonText={g("open_in_deck_builder")}
          onClick={() => window.open(`/casket/?q=${deckcode}`, "_blank")}
        />
      </div>
      <div className="deck_showcase_padding section_title">{g("matchups")}</div>
      <div className="deck_showcase_padding dropdowns_container gap-2">
        <CustomSelect
          options={serverList}
          value={serverList.find(s => s.value === server)?.label || serverList[0].label}
          onChange={ (newServer: Server) => {setServer(newServer)} }
        />
      </div>
      <div className="matchups_table_padding max-h-screen max-w-screen">
        <div className="text-xs max-h-[50vh] overflow-auto">
          <table>
            <thead>
              <tr className="sticky top-0 z-20">
                <th className="sticky left-0 z-10 bg-gray-200 deck_column_width">{tableHeader[0].title}</th>
                {tableHeader.toSpliced(0, 1).map(col => (
                  <ColumnHeaderWithSorter<OpponentData>
                    className="w-1/4 hover:bg-gray-300 transition-background duration-200"
                    text={col.title}
                    key={col.key}
                    columnKey={col.key}
                    isSorting={sortKey === col.key}
                    sortAsc={sortAsc}
                    sortHandlerFn={handleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {
                uniqueOpponentCharacters.length > 0
                ? uniqueOpponentCharacters.map(row => {
                  return <tr key={`${deckIndex}|${row.charactersId.join("-")}`}>
                    <LineupShowcaseForTable
                      characters={[row.charactersId[0], row.charactersId[1], row.charactersId[2]]}
                      border="normal"
                      locale={locale}
                      version={version}
                      localCardsData={localCardsData}
                    />
                    <td>{row.game_count}</td>
                    <td>{row.win_count}</td>
                    <td>{percentize(row.win_rate, locale)}</td>
                    <td>{row.tie_count}</td>
                  </tr>
                })
                : <tr>
                  <td colSpan={5}><NoDataAvailable/></td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </>}
  </div>
}

const computeStats = (dataByPlayer: MatchDataOfSpecific[]) => {
  let stats = {
    weekly_participation: 0,
    bestW: 0,
    bestT: 0,
    bestL: 0,
    n_top_deck: 0,
    rate_top_deck: 0,
    game_count: 0,
    win_count: 0,
    win_rate: 0,
    tie_count: 0
  }
  const uniqueWeek = Array.from(
    new Map(dataByPlayer.map(m => [`${m.server}|${m.week}`, {
      server: m.server,
      week: m.week,
      w: dataByPlayer.filter(m_ => (m_.server === m.server && m_.week === m.week && m_.score === 1)).length,
      t: dataByPlayer.filter(m_ => (m_.server === m.server && m_.week === m.week && m_.isTie)).length,
      l: dataByPlayer.filter(m_ => (m_.server === m.server && m_.week === m.week && m_.score === 0 && !m_.isTie)).length
    }])).values()
  )
  const dataByPlayerIsIncluded = dataByPlayer.filter(m => m.isIncluded)
  stats.weekly_participation = uniqueWeek.length
  stats.bestW = uniqueWeek.length === 0 ? 0 : Math.max(...uniqueWeek.map(m => m.w))
  stats.bestT = uniqueWeek.length === 0 ? 0 : Math.max(...uniqueWeek.filter(m => m.w === stats.bestW).map(m => m.t))
  stats.bestL = uniqueWeek.length === 0 ? 0 : Math.max(...uniqueWeek.filter(m => (m.w === stats.bestW && m.t === stats.bestT)).map(m => m.l))
  stats.n_top_deck = uniqueWeek.reduce((a, m) => {if(m.w >= 4) {a++}; return a}, 0)
  stats.rate_top_deck = stats.weekly_participation === 0 ? 0 : stats.n_top_deck/stats.weekly_participation
  stats.game_count = dataByPlayerIsIncluded.length
  stats.win_count = dataByPlayerIsIncluded.filter(m => m.score === 1).length
  stats.win_rate = stats.game_count === 0 ? 0 : stats.win_count/stats.game_count
  stats.tie_count = dataByPlayerIsIncluded.filter(m => m.isTie).length
  return stats
}