"use client"

import { a } from "@react-spring/web";
import { useGameDataByMatch, useGameDataByPlayer, useMatchData, usePlayerData, useTeamData } from "../hooks";
import { CoopLeagueSeasonPageParams } from "./page";
import Link from "next/link";

export function CoopLeagueSeasonPageClient({ params }: { params: CoopLeagueSeasonPageParams }) {
  const { locale, season } = params

  const teams = useTeamData(season);
  const listedTeamIds = teams.data.map(team => team.id)

  const players = usePlayerData(listedTeamIds)
  // const listedPlayerIds = players.data.map(player => player.id)

  const matches = useMatchData(listedTeamIds)
  const listedMatchIds = matches.data.map(match => match.id)

  const games = useGameDataByMatch(listedMatchIds)

  const matchStats = matches.data.map(match => {
    const gamesByMatch = games.data.filter(game => game.match_id === match.id)

    const stats = gamesByMatch.reduce((a, game) => {
      if (game.is_tie) {
        a.tie++
      } else if (game.winner_player_id === null) {
        a.ongoing++
      } else if (game.winner_player_id === game.player_a_id) {
        a.win_a++
        a.loss_b++
      } else if (game.winner_player_id === game.player_b_id) {
        a.win_b++
        a.loss_a++
      }

      return a
    }, { win_a: 0, win_b: 0, tie: 0, loss_a: 0, loss_b: 0, ongoing: 0 })

    return {
      ...match,
      ...stats,
      isOngoing: !!stats.ongoing || gamesByMatch.length < 3
    }
  })

  const teamStatsUnsorted = teams.data.map(team => {
    const matchByTeam = matchStats.filter(match => match.team_a_id === team.id || match.team_b_id === team.id)

    const stats = matchByTeam.reduce((a, match) => {
      if (match.team_a_id === team.id) {
        a.game.win += match.win_a
        a.game.loss += match.loss_a
        a.pts += 3 * match.win_a + 0.5 * match.loss_a
        if (match.isOngoing) {
          a.match.ongoing++
        } else if (match.win_a > match.loss_a) {
          a.match.win++
        } else if (match.win_a === match.loss_a) {
          a.match.tie++
        } else if (match.win_a < match.loss_a) {
          a.match.loss++
        }

      } else if (match.team_b_id === team.id) {
        a.game.win += match.win_b
        a.game.loss += match.loss_b
        a.pts += 3 * match.win_b + 0.5 * match.loss_b
        if (match.isOngoing) {
          a.match.ongoing++
        } else if (match.win_b > match.loss_b) {
          a.match.win++
        } else if (match.win_b === match.loss_b) {
          a.match.tie++
        } else if (match.win_b < match.loss_b) {
          a.match.loss++
        }
      }

      a.game.tie += match.tie
      a.game.ongoing += match.ongoing

      return a
    }, {
      match: { win: 0, tie: 0, loss: 0, ongoing: 0 },
      game: { win: 0, tie: 0, loss: 0, ongoing: 0 },
      pts: 0
    })

    return { ...team, ...stats }

  }).toSorted((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const teamStatsSorted = teamStatsUnsorted.toSorted((a, b) =>
    b.pts - a.pts
    || b.match.win - a.match.win
    || b.match.loss - a.match.loss
    || b.match.tie - a.match.tie
    || b.game.win - a.game.win
    || b.game.loss - a.game.loss
    || b.game.tie - a.game.tie
  )

  const playerStats = players.data.map(player => {
    const gamesByPlayer = games.data.filter(game => game.player_a_id === player.id || game.player_b_id === player.id)

    const stats = gamesByPlayer.reduce((a, game) => {
      if (game.is_tie) {
        a.tie++
      } else if (game.winner_player_id === null) {
        a.ongoing++
      } else if (game.winner_player_id === player.id) {
        a.win++
        a.pts += 3
      } else {
        a.loss++
        a.pts += 0.5
      }

      return a
    }, { win: 0, tie: 0, loss: 0, ongoing: 0, pts: 0 })

    return { ...player, ...stats }

  }).sort((a, b) =>
    b.pts - a.pts
    || b.win - a.win
    || b.loss - a.loss
    || b.tie - a.tie
  )

  return <div className="mx-auto my-6 px-6 flex flex-col gap-6 min-w-screen">
    <div className="flex flex-col gap-3">
      <h1 className="section_title">Round-Robin Bracket</h1>
      <div className="fullpage_table_container border-t-1 border-gray-300 lg:w-fit lg:self-center"> {/*lg to center it for large screen*/}
        <table className="vertical_border">
          <tbody>
            <tr className="sticky top-0 z-20 bg-white hover:bg-gray-50 group">
              <td className="min-w-18 max-w-18 h-18 sticky left-0 z-10 bg-white group-hover:bg-gray-50"></td>
              {teamStatsUnsorted.map(team => (
                <td key={team.id} className="text-xs min-w-18 max-w-18 h-18">
                  <a href={`/league/team/${team.id}`} className="flex flex-col gap-1 items-center">
                    <img className="w-8 h-8 min-w-8 round" src={`/league/${season}/team_icons/${team.id}.png`} />
                    <div className="text-[10px]">{team.alias}</div>
                  </a>
                </td>
              ))}
            </tr>
            {teamStatsUnsorted.map(team => (
              <tr key={team.id} className="group">
                <td className="text-xs min-w-18 max-w-18 h-18 sticky left-0 z-10 bg-white group-hover:bg-gray-50 transition-all duration-200">
                  <a href={`/league/team/${team.id}`} className="flex flex-col gap-1 items-center">
                    <img className="w-8 h-8 min-w-8 round" src={`/league/${season}/team_icons/${team.id}.png`} />
                    <div className="text-[10px]">{team.alias}</div>
                  </a>
                </td>

                {teamStatsUnsorted.map(opp => (
                  <td key={opp.id}>
                    {team.id !== opp.id && (
                      <div className="text-xs flex flex-col gap-0.25">
                        {(() => {
                          const m = matchStats.find(match => (match.team_a_id === team.id && match.team_b_id === opp.id) || (match.team_a_id === opp.id && match.team_b_id === team.id))
                          if(!m) return;

                          const isTeamA = m.team_a_id === team.id
                          const win = isTeamA ? m.win_a : m.win_b
                          const tie = m.tie
                          const loss = isTeamA ? m.loss_a : m.loss_b

                          let status = ""
                          let color = ""
                          if(m.isOngoing) {
                            status = "Playing"
                            color = "bg-gray-200"
                          } else if (win > loss) {
                            status = "Win"
                            color = "bg-green-200"
                          } else if (win === loss) {
                            status = "Tie"
                            color = "bg-amber-200"
                          } else if (win < loss) {
                            status = "Loss"
                            color = "bg-red-200"
                          }

                          return <Link href={`/league/match/${m.id}`}>
                            <div className="text-[11px] whitespace-nowrap">{`Week ${m.week}`}</div>
                            <div className={`text-[14px] whitespace-nowrap rounded-sm p-0.5 ${color}`}>{status}</div>
                            <div className="text-[11px] whitespace-nowrap">{
                              `${win} – ${tie} – ${loss}`
                            }</div>
                          </Link>
                        })()}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <h1 className="section_title">Standing</h1>
      <div className="self-center">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="w-15">Rank</th>
              <th className="w-75">Team</th>
              <th className="w-18">Points</th>
              <th className="w-30">Match Record</th>
              <th className="w-30">Game Record</th>
            </tr>
          </thead>
          <tbody>
            {teamStatsSorted.map((team, i) => (
              <tr key={team.id}>
                <td>{i + 1}</td>
                <td className="text-start">
                  <a href={`/league/team/${team.id}`} className="flex flex-row items-center gap-2">
                    <img className="w-8 h-8 min-w-8 round" src={`/league/${season}/team_icons/${team.id}.png`} />
                    <p className="clickable_text">
                      <span>{team.name + " "}</span>
                      <span className="text-[10px]">{`(${team.alias})`}</span>
                    </p>
                  </a>
                </td>
                <td>{team.pts.toLocaleString(locale)}</td>
                <td className="whitespace-nowrap">{`${team.match.win} – ${team.match.tie} – ${team.match.loss}`}</td>
                <td className="whitespace-nowrap">{`${team.game.win} – ${team.game.tie} – ${team.game.loss}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <h1 className="section_title">Player Ranking</h1>
      <div className="self-center max-h-[50vh] overflow-auto">
        <table className="text-xs">
          <thead>
            <tr className="sticky top-0 z-20">
              <th className="w-15">Rank</th>
              <th className="w-75">Player</th>
              <th className="w-18">Contributed Points</th>
              <th className="w-30">Game Record</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((player, i) => (
              <tr key={player.id}>
                <td>{i + 1}</td>
                <td className="text-start">{player.display_name + " "}<span className="text-[10px]">{`(${teams.data.find(team => team.id === player.team_id)?.alias || ""})`}</span></td>
                <td>{player.pts.toLocaleString(locale)}</td>
                <td className="whitespace-nowrap">{`${player.win} – ${player.tie} – ${player.loss}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}