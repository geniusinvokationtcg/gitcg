'use client'

import { useMemo, useRef, useState } from "react"
import { LeaderboardPageParams } from "./page";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { notFound, redirect } from "next/navigation";
import { seasons } from "../../seasons";
import { useQuery } from "@tanstack/react-query";
import { parseCSV, parseCSVIgnoreErr } from "@/utils/csvParse";
import { duelistRecordUrl, prefixStatusRegEx, weeklyMatchdataHeader } from "@/utils/vars";
import { DuelistRecord, MatchData, Server, SortingKey } from "@/utils/types";
import { CustomSelect } from "@/components/Dropdown";
import { useSortTable } from "@/hooks/useSortTable";
import { ColumnHeaderWithSorter, NoDataAvailable } from "@/components/Table";
import { getVerLabel } from "@/utils/version";
import { useTranslations } from "next-intl";
import { decodeAndSortActionCards } from "@/utils/decoder";
import { CustomButton } from "@/components/Button";
import { SuccessNotification } from "@/components/PopUp";
import { Tooltip } from "@/components/Tooltip";
import { useShowPopUp } from "@/hooks/utilities";
import { getCardName } from "@/utils/cards";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { useLocalStorage } from "@/hooks/storage";
import Link from "next/link";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getBannedPlayers } from "../../bans";

export function LeaderboardPageClient ({ params }: { params: LeaderboardPageParams }) {
  const { locale, server, version } = params

  const serverList = useTranslatedServers()
  if(server === "all" || !serverList.some(s => s.value === server)) notFound()
  
  const season = seasons[server].find(se => se.versions.includes(version))
  if(!season) notFound()

  const g = useTranslations("General")
  const t = useTranslations("LeaderboardPage")

  const localCardsData = useLocalCardsData(locale)

  const {sortKey, sortAsc, handleSort} = useSortTable<PlayerLeaderboardDataExtended>()

  const { showNotification, popUpTrigger } = useShowPopUp()

  const [enablePreview, setEnablePreview] = useLocalStorage<boolean>("leaderboardDeckPreview", false)
  
  const hovering = useRef<string | null>(null)
  const [, forceRender] = useState(0)
  const handleMouseEnter = (key: string) => {
    if(!enablePreview) return;
    hovering.current = key
    forceRender(x => x+1)
  }
  const handleMouseLeave = () => {
    if(!enablePreview) return;
    hovering.current = null
    forceRender(x => x+1)
  }

  const bannedPlayers = useMemo(() => season.versions.map(v => ({
    version: v,
    banned_players: getBannedPlayers(v)
  })), [season])

  const seasonQuery = useQuery({
    queryKey: season.versions.map(v => `seasondata_${server}_${v}`),
    queryFn: async () => await Promise.all(
      season.versions.map(async v => {
        const parsed = await parseCSV<MatchData>(`/weekly/${v}/matchdata.csv`, weeklyMatchdataHeader)
        const byServer = parsed.data?.filter(row => row.server === server.toUpperCase())
        //console.log(JSON.stringify(byServer))
        return {
          version: v,
          match_data: byServer ?? null,
          weeks: !byServer ? null : Array.from(
            new Set(byServer.map(row => row.week)).values()
          ),
          players: !byServer ? null : Array.from(
            new Set([...byServer.map(row => row.playerid1), ...byServer.map(row => row.playerid2)]).values()
          ).filter(p => p !== null)
        }
      })
    )
  })

  const DRQuery = useQuery({
    queryKey: ["duelist_record"],
    queryFn: () => parseCSVIgnoreErr<DuelistRecord>(duelistRecordUrl, weeklyMatchdataHeader)
  })

  const participatingPlayer: PlayerLeaderboardDataExtended[] = Array.from(
    new Set(seasonQuery.data?.map(v => v.players).flat().filter(playerid => typeof playerid === "number") ?? []).values()
  ).map(playerid => {
    let stats = {
      playerid: playerid,
      handle_display: DRQuery.data?.find(row => row.playerid === playerid)?.handle_display.toString().replace(prefixStatusRegEx, "") ?? (DRQuery.isLoading ? g("loading") : g("error")),
      scores: seasonQuery.data?.map(v => {
        const isBanned = bannedPlayers.find(v_ => v_.version === v.version)?.banned_players.find(p => p.playerid === playerid)
        return {
          version: v.version,
          weeks: v.weeks?.map(w => {
            const matches = [
              ...(v.match_data?.filter(row => row.playerid1 === playerid && row.week === w).map(row => ({
                score: row.score1,
                isTie: row.isTie,
                deckcode: row.deckcode1
              })) ?? []),
              ...(v.match_data?.filter(row => row.playerid2 === playerid && row.week === w).map(row => ({
                score: row.score2,
                isTie: row.isTie,
                deckcode: row.deckcode2
              })) ?? [])
            ]
            return {
              week: w,
              deckcode: (matches.length === 0 || isBanned) ? null : matches[0].deckcode ?? null,
              win_count: (matches.length === 0 || isBanned) ? null : matches.reduce((a, r) => (r.score === 1 ? a+1 : a), 0),
              tie_count: (matches.length === 0 || isBanned) ? null : matches.reduce((a, r) => (r.isTie ? a+1 : a), 0),
              loss_count: (matches.length === 0 || isBanned) ? null : matches.reduce((a, r) => (r.score === 0 && !r.isTie ? a+1 : a), 0)
              //null means the player didn't participate this week
            }
          }) ?? []
        }
      }) ?? [],
      best_x_finish: 0,
      total_wins: 0,
      total_ties: 0,
      total_losses: 0,
      total_games: 0,
    }
    stats.best_x_finish = stats.scores.map(r => r.weeks.map(w => w.win_count)).flat().filter(n => n !== null).sort((a, b) => b-a).slice(0, season.best_finish).reduce((a, b) => a+b, 0)
    stats.total_wins = stats.scores.reduce((a, r) => {
      return a + r.weeks.reduce((a_, r_) => a_ + (r_.win_count ?? 0), 0)
    }, 0)
    stats.total_ties = stats.scores.reduce((a, r) => {
      return a + r.weeks.reduce((a_, r_) => a_ + (r_.tie_count ?? 0), 0)
    }, 0)
    stats.total_losses = stats.scores.reduce((a, r) => {
      return a + r.weeks.reduce((a_, r_) => a_ + (r_.loss_count ?? 0), 0)
    }, 0)
    stats.total_games = stats.total_wins + stats.total_ties + stats.total_losses

    return stats
  }).sort((a, b) => {
    const keys: SortingKey<PlayerLeaderboardData>[] = [
      { key: "best_x_finish", isAscending: false },
      { key: "total_wins", isAscending: false },
      { key: "total_games", isAscending: false },
      { key: "total_ties", isAscending: false },
      { key: "total_losses", isAscending: true },
    ]
    for(const row of keys) {
      const key = row.key
      const aValue = a[key]
      const bValue = b[key]
      let diff = 0;
      if(typeof aValue === "number" && typeof bValue === "number") diff = aValue - bValue
      if(typeof aValue === "string" && typeof bValue === "string") diff = aValue.localeCompare(bValue)
      if(diff !== 0) return row.isAscending ? diff : -diff
    }
    return 0
  }).filter(p => p.playerid > 0 && p.total_games > 0).map((p, i, arr) => {
    let major_qualification = false
    if(season.qualification_type === "top") {
      let top = season.qualification_threshold ?? 8
      major_qualification = i<top ? true : (p.best_x_finish === arr[top-1].best_x_finish && p.total_wins === arr[top-1].total_wins && p.total_games === arr[top-1].total_games)
    } else if(season.qualification_type === "min") {
      let min = season.qualification_threshold ?? (season.best_finish ?? 2)*4
      major_qualification = p.best_x_finish >= min
    }
    return {
      ...p,
      rank: i+1,
      major_qualification: major_qualification
    }
  }).sort((a, b) => {
    if(sortKey){
      let diff = 0
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      if(typeof aValue === "number" && typeof bValue === "number") diff = aValue - bValue
      if(typeof aValue === "string" && typeof bValue === "string") diff = aValue.localeCompare(bValue)
      if(typeof aValue === "boolean" && typeof bValue === "boolean") diff = (aValue ? 1 : 0) - (bValue ? 1 : 0)
      if(diff !== 0) return sortAsc ? diff : -diff
    }
    return 0
  })

  if(!seasonQuery.data && seasonQuery.isLoading) return
  if(!seasonQuery.data) return `Error: ${seasonQuery.error?.message}`

  const rightHandCol = ["total_wins", "total_ties", "total_losses", "total_games"]
  if(season.best_finish) rightHandCol.unshift("best_x_finish")
  if(season.qualification_type) rightHandCol.push("major_qualification")

  return <div className="mx-auto p-6 text-xs max-w-screen">
    <div className="mb-6 gap-2 dropdowns_container">
      <CustomSelect
        options={serverList.filter(s => s.value !== "all")}
        value={serverList.find(s => s.value === server)?.label || serverList[0].label}
        onChange={ (newServer: Server) => {redirect(`/${locale}/leaderboard/${newServer}/`)} }
      />
      <CustomSelect
        options={seasons[server].filter(s => !s.is_hidden && s.versions.length > 0).map(s => ({
          value: s.versions.at(-1)!,
          label: s.versions.length === 1 ? getVerLabel(s.versions[0], locale) : t("season_with_multiple_versions_label", {
            first: getVerLabel(s.versions[0], locale),
            last: getVerLabel(s.versions.at(-1)!, locale)
          })
        }))}
        value={
          season.versions.length === 1 ? getVerLabel(season.versions[0], locale) : t("season_with_multiple_versions_label", {
            first: getVerLabel(season.versions[0], locale),
            last: getVerLabel(season.versions.at(-1)!, locale)
          })
        }
        onChange={v => redirect(`/${locale}/leaderboard/${server}/${v}`)}
      />
      <CustomButton
        buttonText={enablePreview ? g("disable_preview"): g("enable_preview")}
        onClick={() => {setEnablePreview(!enablePreview); popUpTrigger(5000)}}
        textSize="xs"
      />
      <SuccessNotification show={showNotification} text={enablePreview ? g("preview_enabled") : g("preview_disabled")}/>
      <div className="flex gap-2 items-center">
        <Link href="https://docs.google.com/spreadsheets/d/18u31AAyttz1U1e_Qrm2XWDG3xq1MB2mR57BhVT1UCkk" target="_block">
          <CustomButton
            buttonText={g("spreadsheet")}
            textSize="xs"
          />
        </Link>
        <Tooltip position="bottom" content={
          <div className="text-xs w-40">{t("data_difference_with_sheet")}</div>
        }>
          <InformationCircleIcon className="size-5"/>
        </Tooltip>
      </div>
      
      
    </div>
    <div className="fullpage_table_container">
      <table className="vertical_border">
        <thead className="sticky top-0 z-20 bg-gray-200">
          <tr>
            <ColumnHeaderWithSorter<PlayerLeaderboardDataExtended>
              className = "w-8 sticky left-0 z-10 bg-gray-200"
              text = "#"
              columnKey = "rank"
              isSorting = {sortKey === "rank"}
              sortAsc = {sortAsc}
              sortHandlerFn = {handleSort}
              isAscendingFirst = {true}
              rowSpan={3}
            />
            <ColumnHeaderWithSorter<PlayerLeaderboardDataExtended>
              className = "w-40 sticky left-[32.8px] z-10 bg-gray-200"
              text = {t("duelist_handle")}
              columnKey = "handle_display"
              isSorting = {sortKey === "handle_display"}
              sortAsc = {sortAsc}
              sortHandlerFn = {handleSort}
              isAscendingFirst = {true}
              rowSpan={3}
            />
            {seasonQuery.data.filter(v => v.match_data).map(v => v.match_data !== null && v.match_data.length > 0 &&
              <th className="compact_py_top" colSpan={v.weeks ? v.weeks.length*3 : 0} key={`${v.version}_header`}>
                {t("version_v", { version: getVerLabel(v.version, locale)})}
              </th>)
            }
            {rightHandCol.map(key =>
              <ColumnHeaderWithSorter<PlayerLeaderboardDataExtended>
                key = {key}
                className = "min-w-16 w-16"
                text = {t(key, { x: season.best_finish ?? "" })}
                columnKey = {key}
                isSorting = {sortKey === key}
                sortAsc = {sortAsc}
                sortHandlerFn = {handleSort}
                rowSpan={3}
              />
            )}
          </tr>
          <tr>
            {seasonQuery.data.filter(v => v.match_data).map(v => v.weeks?.map(w => <th className="compact_py_middle" colSpan={3} key={`${v.version}_${w}`}>
              {t("week_num", { week: w })}
            </th>) ?? []).flat()}
          </tr>
          <tr className="wtl_leaderboard">
            {seasonQuery.data.filter(v => v.match_data).map(v => v.weeks?.flatMap(w => [
              <th className="compact_py_bottom" key={`${v.version}_${w}_w`}>
                {t("win_count")}
              </th>,
              <th className="compact_py_bottom" key={`${v.version}_${w}_t`}>
                {t("tie_count")}
              </th>,
              <th className="compact_py_bottom" key={`${v.version}_${w}_l`}>
                {t("loss_count")}
              </th>
            ]) ?? [])}
          </tr>
        </thead>
        <tbody>
          {participatingPlayer.map(p => 
            <tr key={p.playerid} className="compact_py group">
              <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 transition-all duration-200">{p.rank}</td>
              <td className="text-left text-ellipsis whitespace-nowrap sticky left-[32.8px] z-10 bg-white group-hover:bg-gray-50 transition-all duration-200">
                <Link href={`/${locale}/weekly/${seasonQuery.data.filter(s => s.match_data).at(-1)!.version}/player/${p.playerid}`}>{p.handle_display}</Link>
              </td>
              {p.scores.map(v => v.weeks?.flatMap(w => {
                let characters: string[] = []
                if(w.deckcode) characters = decodeAndSortActionCards(w.deckcode).slice(0, 3).map(c => getCardName(c, localCardsData))
                return [
                  <td onMouseEnter={() => handleMouseEnter(`${p.playerid}_${v.version}_${w.week}`)} onMouseLeave={handleMouseLeave} key={`${p.playerid}_${v.version}_${w.week}_w`}>{w.win_count}</td>,
                  <td onMouseEnter={() => handleMouseEnter(`${p.playerid}_${v.version}_${w.week}`)} onMouseLeave={handleMouseLeave} key={`${p.playerid}_${v.version}_${w.week}_t`} className="relative">
                    {w.tie_count}
                    {enablePreview && characters.length === 3 && <div className={`${hovering.current === `${p.playerid}_${v.version}_${w.week}` ? "block" : "hidden"} whitespace-nowrap absolute left-1/2 bottom-full mb-2 -translate-x-1/2 rounded-sm bg-white border-1 border-gray-200 text-xs p-2 z-30`}>
                      {characters.join(" | ")}
                    </div>}
                  </td>,
                  <td onMouseEnter={() => handleMouseEnter(`${p.playerid}_${v.version}_${w.week}`)} onMouseLeave={handleMouseLeave} key={`${p.playerid}_${v.version}_${w.week}_l`}>{w.loss_count}</td>
                ]
              }) ?? [])}
              {season.best_finish && <td>{p.best_x_finish}</td>}
              <td>{p.total_wins}</td>
              <td>{p.total_ties}</td>
              <td>{p.total_losses}</td>
              <td>{p.total_games}</td>
              {season.qualification_type && <td className="whitespace-nowrap">{p.major_qualification ? t("qualified_for_major") : t("not_qualified_for_major")}</td>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {participatingPlayer.length === 0 && <NoDataAvailable/>}
  </div>
}

interface PlayerLeaderboardData {
  playerid: number;
  handle_display: string;
  scores: {
    version: string;
    weeks: {
      week: number;
      deckcode: string | null;
      win_count: number | null;
      tie_count: number | null;
      loss_count: number | null;
    }[];
  }[];
  best_x_finish: number;
  total_wins: number;
  total_ties: number;
  total_losses: number;
  total_games: number;
}

interface PlayerLeaderboardDataExtended extends PlayerLeaderboardData {
  rank: number;
  major_qualification: boolean
}