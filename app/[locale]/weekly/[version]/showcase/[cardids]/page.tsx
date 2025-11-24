'use client';

import { gameVersion, getVerLabel } from '@/utils/version';
import { notFound, redirect, usePathname } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { decode, decodeAndSortActionCards } from '@/utils/decoder';
import { useWeeklyData } from "@/hooks/useWeeklyData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { useSortTable } from "@/hooks/useSortTable";
import { useCopiedPopUp } from "@/hooks/utilities";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { useTranslations } from "next-intl";
import { Locales, DeckData, SortingKey, Server, MatchDataOfSpecific, OpponentData } from "@/utils/types";
import { getCardName, getCardIdByName } from '@/utils/cards';
import { compileDeckData } from "@/utils/deckData";
import { percentize } from "@/utils/formatting";
import { handleCopy } from "@/utils/clipboard";
import cardsData from "@/cards.json";
import { CustomButton, IndexSelector } from "@/components/Button";
import { SuccessNotification } from "@/components/PopUp";
import { LineupShowcaseForTable, NoDataAvailable, ColumnHeaderWithSorter } from "@/components/Table";
import { CustomSelect } from "@/components/Dropdown";
import { CardImageMedium, CardImageLarge } from "@/components/CardImage";

export default function DeckShowcasePage({ params }: { params: Promise<{ locale: Locales; version: string; cardids: string }> }) {
  const { locale, version, cardids } = use(params);
  const pathname = usePathname()
  if(version in gameVersion.redirect) redirect(pathname.replace(version, gameVersion.redirect[version as keyof typeof gameVersion.redirect]));
  if(gameVersion.available.indexOf(version) < 0) notFound();

  const localCardsData = useLocalCardsData(locale)

  const g = useTranslations("General");
  const t = useTranslations("DeckShowcasePage");
  const h = useTranslations("WeeklyStatistic.tableHeader");

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

  const charactersId = cardids.split("-").map(c => Number(c));
  const charactersName: string[] = charactersId.map(char => cardsData.codes.find(code => char === code.id)?.name || "");
  const charactersNameSorted = charactersName.toSorted((a,b) => a.localeCompare(b));
  const characters = charactersNameSorted.join("\\\\");
  
  usePageTitle(t("title", { version: getVerLabel(version, locale), lineup: charactersId.map(cardId => getCardName(cardId, localCardsData)).join(" | ")}));
  
  const dataByCharacters: MatchDataOfSpecific[] = useMemo(() => {
    const seen: MatchDataOfSpecific[] = [];
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
      if(row.characters1 === characters) seen.push({
        deckcode: row.deckcode1,
        cardsId: decodeAndSortActionCards(row.deckcode1).join("|"),
        opponent: row.characters2,
        opponent_playerid: row.playerid2,
        score: row.score1,
        ...matchDetail
      });
      if(row.characters2 === characters) seen.push({
        deckcode: row.deckcode2,
        cardsId: decodeAndSortActionCards(row.deckcode2).join("|"),
        opponent: row.characters1,
        opponent_playerid: row.playerid1,
        score: row.score2,
        ...matchDetail
      });
    });
    return seen;
  }, [parsedData, characters]);
  

  const uniqueCardsId = useMemo(() => {
    const seen = new Map<string, { cardsId: string, deckcode: string, score: number }>();
    dataByCharacters.forEach(row => {
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
        cardsId.some(str => { isNaN(Number(str)) })
      );
    });
  }, [dataByCharacters])
  
  const dataByCharactersButIncluded = dataByCharacters.filter(row => row.isIncluded);
  const uniqueOpponents: OpponentData[] = useMemo(() => {
    const byServer = server === "all" ? dataByCharactersButIncluded : dataByCharactersButIncluded.filter(row => row.server === server.toUpperCase());
    const opponents = byServer.map(row => row.opponent);
    return [...new Set(opponents)].filter(opp => opp !== "").map(opp => {
      const opponentDeckcode = parsedData.find(row => row.characters1 === opp && row.characters2 === characters)?.deckcode1
        || parsedData.find(row => row.characters2 === opp && row.characters1 === characters)?.deckcode2
        || "";
      const decodedOpponentCardNames = decode(opponentDeckcode, "name").data || [];

      //const opponentCharacters = opp.split("\\\\");
      const games = byServer.filter(row => row.opponent === opp);
      const wins = games.filter(row => row.score === 1);
      const ties = games.filter(row => row.isTie);
      return {
        character1: decodedOpponentCardNames[0]?.toString() || "",
        character2: decodedOpponentCardNames[1]?.toString() || "",
        character3: decodedOpponentCardNames[2]?.toString() || "",
        charactersId: decodedOpponentCardNames.map(c => getCardIdByName(c.toString(), "characters")),
        game_count: games.length,
        win_count: wins.length,
        win_rate: wins.length / games.length || 0,
        tie_count: ties.length
      }
    }).sort((a,b) => {
      const keys: SortingKey<OpponentData>[] = [
        {key: "win_count", isAscending: false},
        {key: "win_rate", isAscending: false},
        {key: "tie_count", isAscending: false},
        {key: "game_count", isAscending: false},
        {key: "character1", isAscending: true},
        {key: "character2", isAscending: true},
        {key: "character3", isAscending: true}
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
    });
  }, [dataByCharacters, server, sortKey, sortAsc]);

  const [deckIndex, setDeckIndex] = useState<number>(0);
  const [characterCards, setCharacterCards] = useState<number[]>([]);
  const [actionCards, setActionCards] = useState<number[]>([]);
  const [deckcode, setDeckcode] = useState<string>("");
  const [compiledDeckData, setCompiledDeckData] = useState<DeckData>();
  useEffect(() => {
    if(isLoading) return;
    const cardsId = uniqueCardsId[deckIndex].cardsId.split("|").map(str => +str);
    setCharacterCards(cardsId.splice(0, 3));
    setActionCards(cardsId);
    setDeckcode(uniqueCardsId[deckIndex].deckcode)
    setCompiledDeckData(compileDeckData(parsedData, characters) as DeckData);
  }, [deckIndex, uniqueCardsId])

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp();
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false);

  if(isLoading) return;
  if(error) return <p>Uh, there seems to be a trouble<br />{error.message}</p>
  if(dataByCharacters.length === 0) notFound();

  return <div className="showcase_page_margin">
    <h1 className="deck_showcase_padding section_title">
      {characterCards.map(c => getCardName(c, localCardsData)).join(" | ")}
    </h1>
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
      {["usage_player", "best_result", "rate_top_deck", "usage_match", "win_count", "win_rate", "tie_count"]
        .map((key) => (
          <div key={key}>
            <div>{h.rich(key, {break: () => ""})}</div>
            <div>
              {
                !compiledDeckData
                ? "-"
                : (key === "best_result"
                  ? `${compiledDeckData.bestW}–${compiledDeckData.bestT}–${compiledDeckData.bestL}`
                  : (key.indexOf("rate") < 0 ? compiledDeckData[key as keyof DeckData] : percentize(compiledDeckData[key as keyof DeckData], locale))
                  )
              }
            </div>
          </div>
        ))
      }
    </div>
    <div className="deck_showcase_padding section_title">{g("decklist")}</div>
    <IndexSelector
      currentIndex={deckIndex+1}
      setIndexFn={setDeckIndex}
      maxIndex={uniqueCardsId.length}
    />
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
              {tableHeader.toSpliced(0, 1).map((col, i) => (
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
              uniqueOpponents.length > 0
              ? uniqueOpponents.map(row => (
                <tr key={`${row.character1}\\\\${row.character2}\\\\${row.character3}`}>
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
              ))
              : null
            }
          </tbody>
        </table>
        {uniqueOpponents.length > 0 ? null : <NoDataAvailable className="border-b-1 border-gray-300"/>}
      </div>
    </div>
  </div>
}