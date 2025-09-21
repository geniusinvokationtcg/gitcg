'use client';

import { redirect, notFound, usePathname } from 'next/navigation';
import { gameVersion, getVerLabel } from "@/utils/version";
import { use, useState, useMemo } from "react";
import { useWeeklyData } from "@/hooks/useWeeklyData"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { useLocalCardsData } from '@/hooks/useLocalCardsData';
import { useTranslations } from "next-intl";
import { CustomSelect, ColumnVisibilityDropdown } from "@/components/Dropdown";
import { LineupShowcaseForTable, NoDataAvailable, ColumnHeaderWithSorter } from "@/components/Table";
import { Locales, Server, DeckData, SortingKey } from '@/utils/types'
import { compileDeckData } from '@/utils/deckData';
import { percentize } from "@/utils/formatting";
import { useSortTable } from '@/hooks/useSortTable';

export default function WeeklyStatPageClient({ params }: { params: Promise<{ locale: Locales; version: string }> }){
  const { locale, version } = use(params);
  const pathname = usePathname()
  if(version in gameVersion.redirect) redirect(pathname.replace(version, gameVersion.redirect[version as keyof typeof gameVersion.redirect]));
  if(gameVersion.available.indexOf(version) < 0) notFound();
  
  const localCardsData = useLocalCardsData(locale)
  const t = useTranslations("WeeklyStatistic");
  const h = useTranslations("WeeklyStatistic.tableHeader");
  usePageTitle(t("title", {version: getVerLabel(version, locale)}));
  
  const [server, setServer] = useState<Server>("all");
  const serverList = useTranslatedServers();
  const [week, setWeek] = useState<number>(NaN);
  
  const {sortKey, sortAsc, handleSort} = useSortTable<DeckData>();

  const [tableHeader, setTableHeader] = useState([
    { key: "deck", isShown: true },
    { key: "usage_player", isShown: true },
    { key: "usage_rate_player", isShown: true },
    { key: "best_result", isShown: true },
    { key: "n_top_deck", isShown: false },
    { key: "rate_top_deck", isShown: true },
    { key: "stderr_top_deck", isShown: false },
    { key: "usage_match", isShown: true },
    { key: "usage_rate_match", isShown: true },
    { key: "win_count", isShown: true },
    { key: "win_rate", isShown: true },
    { key: "stderr", isShown: true },
    { key: "win_count_nomirror", isShown: true },
    { key: "win_rate_nomirror", isShown: true },
    { key: "stderr_nomirror", isShown: true },
    { key: "tie_count", isShown: true }
  ].map(col => {
    return {...col, title: h.rich(col.key, { break: () => ""}) as string }
  }));
  const toggleColumn = (key: string) => {
    setTableHeader(tableHeader.map(col => 
      col.key === key ? { ...col, isShown: !col.isShown } : col
    ));
  };
  //<select> component change handler
  //const changeServer = (e: React.ChangeEvent<HTMLSelectElement>) => {setServer(e.target.value as Server);};
  const changeServer = (newServer: Server) => {setServer(newServer);}
  const changeWeek = (newWeek: number) => {setWeek(newWeek);}
  //const changeVersion = (e: React.ChangeEvent<HTMLSelectElement>) => {redirect(`/${locale}/weekly/${e.target.value}`)};
  const changeVersion = (newVersion: string) => {redirect(`/${locale}/weekly/${newVersion}`);};
  
  const { parsedData, isLoading, error } = useWeeklyData(version);

  const weeks = useMemo(() => [...new Set(parsedData.map(row => row.week))].sort((a,b) => a-b), [parsedData]);

  //Filtering data based on <select>ion
  let data = parsedData;
  if(server !== "all") data = data.filter(row => row.server === server.toUpperCase());
  if(!Number.isNaN(week)) data = data.filter(row => row.week === week);
  
  const compiledData = useMemo(() => compileDeckData(data) as DeckData[], [data]);
  
  const filteredData = useMemo(() => compiledData.filter(row => row.usage_match !== 0), [compiledData]);

  const sortedData = useMemo(() => {return filteredData.sort((a: DeckData, b: DeckData) => {
    const keys: SortingKey<DeckData>[] = [
      {key: "win_count", isAscending: false},
      {key: "win_rate", isAscending: false},
      {key: "win_count_nomirror", isAscending: false},
      {key: "win_rate_nomirror", isAscending: false},
      {key: "tie_count", isAscending: false},
      {key: "n_top_deck", isAscending: false},
      {key: "rate_top_deck", isAscending: false},
      {key: "bestW", isAscending: false},
      {key: "bestT", isAscending: false},
      {key: "bestL", isAscending: false},
      {key: "usage_match", isAscending: false},
      {key: "usage_player", isAscending: false},
      {key: "character1", isAscending: true},
      {key: "character2", isAscending: true},
      {key: "character3", isAscending: true}
    ];
    if(sortKey){
      if(sortKey === "best_result") {
        keys.unshift({key: "bestL", isAscending: sortAsc});
        keys.unshift({key: "bestT", isAscending: sortAsc});
        keys.unshift({key: "bestW", isAscending: sortAsc});
      } else {keys.unshift({key: sortKey, isAscending: sortAsc});};
    };
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
  });}, [filteredData, sortKey, sortAsc]);
  
  

  if(isLoading) return
  if(error) return <p>Uh, there seems to be a trouble<br />{error.message}</p>

  return <div className="mx-auto p-6 text-xs min-w-screen">
    <div className="mb-6 gap-2 dropdowns_container">
      <CustomSelect
        options={gameVersion.available.toReversed().map(v => ({ value: v, label: getVerLabel(v, locale) }))}
        value={getVerLabel(version, locale)}
        onChange={changeVersion}
      />
      <CustomSelect
        options={serverList}
        value={serverList.find(s => s.value === server)?.label || serverList[0].label}
        onChange={changeServer}
      />
      <CustomSelect
        options={[{ value: NaN, label: t("entire_version") }, ...weeks.map(w => ({ value: w, label: t("week_num", { week: w }) }) )]}
        value={Number.isNaN(week) ? t("entire_version") : t("week_num", { week: week } )}
        onChange={changeWeek}
      />
      <ColumnVisibilityDropdown
        columns={tableHeader.toSpliced(0, 1)}
        onToggle={toggleColumn}
        buttonText={t("showOrHide")}
      />
    </div>
    <div className="fullpage_table_container">
      <table>
        <thead className="sticky top-0 z-20 bg-gray-200">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-200 deck_column_width">{tableHeader.find(h => h.key === "deck")?.title}</th>
            {tableHeader.toSpliced(0, 1).filter(col => col.isShown).map((col) => (
              <ColumnHeaderWithSorter<DeckData>
                text={<span className={`${locale === "zh-cn" ? "whitespace-nowrap" : ""}`}>
                  {h.rich(col.key, {break: () => <br />})}
                </span>}
                key={col.key}
                columnKey = {col.key}
                isSorting={sortKey === col.key}
                sortAsc={sortAsc}
                sortHandlerFn={handleSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row: any, index) => (
            <tr key={index} className="group">
              <LineupShowcaseForTable 
                characters={[row.characterId1, row.characterId2, row.characterId3]}
                border="normal"
                locale={locale}
                version={version}
                localCardsData={localCardsData}
              />
              {tableHeader.toSpliced(0, 1).filter(col => col.isShown).map((col) => (
                <td key={col.key}>
                  {
                    col.key !== "best_result"
                    ? (col.key.indexOf("rate") >= 0 || col.key.indexOf("stderr") >= 0 ? percentize(row[col.key], locale) : row[col.key])
                    : <span className="whitespace-nowrap">{`${row.bestW}–${row.bestT}–${row.bestL}`}</span>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <NoDataAvailable className="border-b-1 border-gray-300"/>}
    </div>
  </div>
}