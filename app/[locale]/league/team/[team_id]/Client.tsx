"use client"

import "../../style.css";
import { useGameDataByMatch, useMatchData, useSeasonData, useTeamData } from "../../hooks";
import { CoopLeagueTeamPageParams } from "./page";
import Link from "next/link";

export function CoopLeagueTeamPageClient({ params, season_id }: { params: CoopLeagueTeamPageParams; season_id: string }) {
  const { locale, team_id } = params;

  const seasons = useSeasonData();
  const seasonName = seasons.data.find(s => s.season_id === season_id)?.name

  const teams = useTeamData(season_id);
  const currentTeam = teams.data.find(team => team.id === team_id)

  const matches = useMatchData([team_id])

  const games = useGameDataByMatch(matches.data.map(match => match.id))

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

  if (!currentTeam) return;

  return <div className="league_body">
    <section>
      <h1>{`GITCG Co-op League ${seasonName || ""} Team`}</h1>

      <div>
        <h1 className="font-semibold">{currentTeam.name}</h1>
        <p className="text-center text-sm">{currentTeam.alias}</p>
      </div>

      <img src={`/league/${season_id}/team_icons/${currentTeam.id}.png`}
        className="avatar"
        alt="Avatar"
      />

      <div className="stat_showcase">
        {(() => {
          const teamStat = matchStats.reduce((a, match) => {
            const isTeamA = match.team_a_id === team_id

            let teamLetter: "a" | "b" = isTeamA ? "a" : "b"
            const matchWin = match[`win_${teamLetter}`]
            const matchLoss = match[`loss_${teamLetter}`]

            //MATCH RECORD
            if (match.isOngoing) {
              a.match.ongoing++
            } else if (matchWin > matchLoss) {
              a.match.win++
            } else if (matchWin === matchLoss) {
              a.match.tie++
            } else if (matchWin < matchLoss) {
              a.match.loss++
            }

            if (!match.isOngoing) {
              a.match.concluded++
            }

            //GAME RECORD
            a.game.win += matchWin
            a.game.tie += match.tie
            a.game.loss += matchLoss
            a.game.ongoing += match.ongoing
            a.game.concluded += matchWin + match.tie + matchLoss

            a.pts += 3 * matchWin + 0.5 * matchLoss

            return a;
          }, {
            match: { win: 0, tie: 0, loss: 0, ongoing: 0, concluded: 0 },
            game: { win: 0, tie: 0, loss: 0, ongoing: 0, concluded: 0 },
            pts: 0
          })

          return <>
            <div>
              <div>Matches</div>
              <div>{teamStat.match.concluded}</div>
            </div>
            <div>
              <div>Match Record</div>
              <div className="whitespace-nowrap">{`${teamStat.match.win}–${teamStat.match.tie}–${teamStat.match.loss}`}</div>
            </div>
            <div>
              <div>Games</div>
              <div>{teamStat.game.concluded}</div>
            </div>
            <div>
              <div>Game Record</div>
              <div className="whitespace-nowrap">{`${teamStat.game.win}–${teamStat.game.tie}–${teamStat.game.loss}`}</div>
            </div>
            <div>
              <div>Points</div>
              <div>{teamStat.pts}</div>
            </div>
          </>
        })()}
      </div>
    </section>

    <section>
      <h1>Matches</h1>
      <div className="match_cards_container">
        {matchStats.map(match => {
          const isTeamA = match.team_a_id === team_id
          const thisTeam = teams.data.find(team => team.id === (isTeamA ? match.team_a_id : match.team_b_id))
          const oppTeam = teams.data.find(team => team.id === (isTeamA ? match.team_b_id : match.team_a_id))

          const teamAScore = { win: match.win_a, tie: match.tie, loss: match.loss_a }
          const teamBScore = { win: match.win_b, tie: match.tie, loss: match.loss_b }
          const thisTeamScore = isTeamA ? teamAScore : teamBScore
          const oppTeamScore = isTeamA ? teamBScore : teamAScore

          if (!thisTeam || !oppTeam) return;

          return (
            <Link key={match.id} className="hoverable_card match_card" href={`/league/match/${match.id}`}>
              <div className="text-center">{`Week ${match.week}`}</div>
              <div className="self-center">
                <div className="card_grid card_grid_team_name">
                  <div className="flex justify-end">
                    <div className="text-end">
                      <p>{thisTeam.name}</p>
                      <p>{thisTeam.alias}</p>
                    </div>
                    <img src={`/league/${season_id}/team_icons/${thisTeam.id}.png`} className="round w-10 h-10" />
                  </div>

                  <div className="flex items-center justify-center">VS</div>

                  <div>
                    <img src={`/league/${season_id}/team_icons/${oppTeam.id}.png`} className="round w-10 h-10" />
                    <div className="text-start">
                      <p>{oppTeam.name}</p>
                      <p>{oppTeam.alias}</p>
                    </div>

                  </div>
                </div>
                <div className="card_grid">
                  <div className="flex justify-end">
                    <div className="w-10 text-center">{thisTeamScore.win}</div>
                  </div>
                  <div />
                  <div className="flex justify-start">
                    <div className="w-10 text-center">{oppTeamScore.win}</div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  </div>
}