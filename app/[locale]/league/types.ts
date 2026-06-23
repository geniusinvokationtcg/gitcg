import { ServerPure } from "@/utils/types"

type LeagueWeekStatus = "not_started" | "ongoing" | "concluded"
type LeagueTeamStatus = "active" | "dropped"
type LeaguePlayerStatus = "active" | "dropped"
type LeagueMatchPhase = "round_robin" | "playoff"

export interface LeagueSeason {
  id: string
  created_at: string
  season_id: string
  name: string | null
}

export interface LeagueWeek {
  id: string
  created_at: string
  season_id: string
  week: string
  status: LeagueWeekStatus
  story_title: string | null
  story_description: string | null
  rules_title: string | null
  rules_description: string | null
}

export interface LeagueTeam {
  id: string
  created_at: string
  season_id: string
  name: string
  alias: string
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
  season_id: string
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
  deckcode_a: string
  deckcode_b: string
}