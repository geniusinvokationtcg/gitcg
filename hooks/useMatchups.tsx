'use client'

import cardsData from "@/cards.json";
import { getCardIdByName, getCardName } from "@/utils/cards";
import { decode } from "@/utils/decoder";
import { MatchData, MatchDataOfSpecific, Server, SortingKey, OpponentData, Locales, CardsDataType } from "@/utils/types";
import { useSortTable } from "./useSortTable";
import { ColumnHeaderWithSorter, LineupShowcaseForTable, NoDataAvailable } from "@/components/Table";
import { percentize } from "@/utils/formatting";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function useMatchups(
  parsedData: MatchData[],
  dataBySpecific: MatchDataOfSpecific[],
  characterCards: number[],
  server: Server,
  locale: Locales,
  version: string,
  localCardsData: CardsDataType
) {
  const t = useTranslations("DeckShowcasePage");

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

  const characters = characterCards
    .map(c => getCardName(c, cardsData))
    .toSorted((a,b) => a.localeCompare(b))
    .join("\\\\");
  
  const uniqueOpponents: OpponentData[] = useMemo(() => {
    const byServer = server === "all" ? dataBySpecific : dataBySpecific.filter(row => row.server === server.toUpperCase());
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
  }, [parsedData, dataBySpecific, server, sortKey, sortAsc]);

  const table = useMemo(() => <div className="matchups_table_padding max-h-screen max-w-screen">
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
  </div>, [uniqueOpponents, tableHeader, server, locale, version])

  return {
    uniqueOpponents,
    sortAsc,
    sortKey,
    handleSort,
    table
  }
}