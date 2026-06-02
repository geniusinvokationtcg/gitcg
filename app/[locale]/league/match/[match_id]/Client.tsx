"use client"

import "../../style.css";
import { useGameDataByMatch, usePlayerData, useSeasonData } from "../../hooks";
import { LeagueMatch, LeagueTeam } from "../../types";
import { CoopLeagueMatchPageParams } from "./page";
import Link from "next/link";
import { decodeAndSortActionCards } from "@/utils/decoder";
import { CardImage } from "@/components/CardImage";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { CustomButton } from "@/components/Button";
import { EyeIcon } from "@heroicons/react/24/outline";
import { serverList } from "@/utils/vars";
import { useTranslations } from "next-intl";

export function CoopLeagueMatchPageClient({ params, season_id, match, teams }: { params: CoopLeagueMatchPageParams; season_id: string; match: LeagueMatch; teams: LeagueTeam[] }) {
  //reorder the team correctly
  teams = [
    teams.find(team => team.id === match.team_a_id) || teams[0],
    teams.find(team => team.id === match.team_b_id) || teams[1]
  ]
  
  const { locale, match_id } = params;

  const localCardsData = useLocalCardsData(locale)

  const t = useTranslations("CoopLeague")

  const seasons = useSeasonData();
  const seasonName = seasons.data.find(s => s.season_id === season_id)?.name

  const players = usePlayerData(teams.map(team => team.id))

  const games = useGameDataByMatch([match.id])

  const matchStat = (() => {
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
  })()

  return <div className="league_body">
    <section>
      <h1>{`GITCG Co-op League ${seasonName} Week ${match.week}`}</h1>
      <div className="teams_header">
        <Link href={`/league/team/${teams[0].id}`}>
          <div>
            <p>{teams[0].name}</p>
            <p>{teams[0].alias}</p>
          </div>
          <img src={`/league/${season_id}/team_icons/${teams[0].id}.png`} className="round w-25 h-25" />
        </Link>
        <div>{`${matchStat.win_a} – ${matchStat.win_b}`}</div>
        <Link href={`/league/team/${teams[1].id}`}>
          <img src={`/league/${season_id}/team_icons/${teams[1].id}.png`} className="round w-25 h-25" />
          <div>
            <p>{teams[1].name}</p>
            <p>{teams[1].alias}</p>
          </div>
        </Link>
      </div>
    </section>

    <section>
      <h1>Games</h1>
      <div className="game_cards_container">
        {games.data.toSorted((a, b) => a.game_number - b.game_number).map(game => {
          const playerA = players.data.find(p => p.id === game.player_a_id)
          const playerB = players.data.find(p => p.id === game.player_b_id)

          const deckA = decodeAndSortActionCards(game.deckcode_a)
          const deckB = decodeAndSortActionCards(game.deckcode_b)

          const serverName = serverList.find(s => s.value === game.server)?.label || game.server.toUpperCase()

          if(!playerA || !playerB) return;

          const isATheWinner = game.winner_player_id === game.player_a_id

          let statusA = ""
          let statusB = ""
          let color = ""
          if(game.is_tie) {
            statusA = "tie"
            statusB = "tie"
          } else if (!game.winner_player_id) {
            statusA = "ongoing"
            statusB = "ongoing"
          } else if (isATheWinner) {
            statusA = "win"
            statusB = "lose"
          } else {
            statusA = "lose"
            statusB = "win"
          }

          function bgColor (status: string) {
            switch(status) {
              case "tie": return "bg-amber-200"
              case "win": return "bg-green-200"
              case "lose": return "bg-red-200"
              default: return "bg-gray-200"
            }
          }


          return (
            <div key={game.id} className="hoverable_card game_card">
              <div className="text-center">{`Game ${game.game_number} - ${serverName}`}</div>
              <div className="self-center flex flex-col gap-1">
                <div className="card_grid card_grid_team_name">
                  <div className="flex justify-end">
                    <div className="text-end">
                      <p>{playerA.display_name}</p>
                      <p>{teams[0].alias}</p>
                    </div>
                    <img src={`/league/${season_id}/team_icons/${teams[0].id}.png`} className="round w-10 h-10" />
                  </div>

                  <div className="flex items-center justify-center">VS</div>

                  <div>
                    <img src={`/league/${season_id}/team_icons/${teams[1].id}.png`} className="round w-10 h-10" />
                    <div className="text-start">
                      <p>{playerB.display_name}</p>
                      <p>{teams[1].alias}</p>
                    </div>

                  </div>
                </div>

                <div className="card_grid">
                  <div className="flex justify-end gap-1.25 items-center">
                    <CustomButton
                      type="icon"
                      buttonText={
                        <EyeIcon className="size-4"/>
                      }
                      onClick={() => window.open(`/casket?q=${game.deckcode_a}`)}
                    />
                    <div className="flex gap-0.5">{deckA.slice(0, 3).map(card_id => (
                      <CardImage
                        key={card_id}
                        cardId={card_id}
                        cardType="characters"
                        size={36}
                        localCardsData={localCardsData}
                      />
                    ))}</div>
                  </div>
                  
                  <div/>
                  
                  <div className="flex justify-start gap-1.25 items-center">
                    <div className="flex gap-0.5">{deckB.slice(0, 3).map(card_id => (
                      <CardImage
                        key={card_id}
                        cardId={card_id}
                        cardType="characters"
                        size={36}
                        localCardsData={localCardsData}
                      />
                    ))}</div>
                    <CustomButton
                      type="icon"
                      buttonText={
                        <EyeIcon className="size-4"/>
                      }
                      onClick={() => window.open(`/casket?q=${game.deckcode_a}`)}
                    />
                  </div>
                </div>

                <div className="card_grid">
                  <div className={`flex ml-auto py-0.5 px-2 rounded-sm ${bgColor(statusA)}`}>{t(statusA)}</div>
                  <div/>
                  <div className={`flex mr-auto py-0.5 px-2 rounded-sm ${bgColor(statusB)}`}>{t(statusB)}</div>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </section>
  </div>
}