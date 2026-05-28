import { ServerPure } from "@/utils/types"

type LeagueTeamStatus = "active" | "dropped"
type LeaguePlayerStatus = "active" | "dropped"
type LeagueMatchPhase = "round_robin" | "playoff"

export interface LeagueSeason {
  id: number
  created_at: string
  season_id: string
  name: string | null
}

export interface LeagueTeam {
  id: string
  created_at: string
  season_id: string
  name: string
  alias: string | null
  logo_url: string | null
  status: LeagueTeamStatus
}

export interface LeaguePlayer {
  id: string
  created_at: string
  team_id: string
  player_id: number | null
  display_name: string
  status: LeaguePlayerStatus
  servers: ServerPure[]
  is_leader: boolean
}

export interface LeagueMatch {
  id: string
  created_at: string
  team_a_id: string
  team_b_id: string
  week: string
  order: number | null
  phase: LeagueMatchPhase
}

export interface LeagueGame {
  id: string
  created_at: string
  match_id: string
  game_number: number
  player_a_id: string
  player_b_id: string
  winner_player_id: string
  server: ServerPure
  is_tie: boolean
}