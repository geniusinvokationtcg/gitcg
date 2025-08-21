import { UrlObject } from "url";
import { routing } from "../i18n/routing";

export type Locales = typeof routing.locales[number]

export type Maybe<T> = { data: null; error: Error } | { data: T; error: null };
export const ErrorResult = ((str: string) => { return { data: null, error: new Error(str) } });
export const SuccessResult = <T>(data: T) => { return { data, error: null } };

export type Server = "all" | ServerPure;
export type ServerPure = "na" | "eu" | "as";

export type CardType = "characters" | "actions";

export type BorderType = "normal" | "dynamic" | "lustrous";

export interface SortingKey<T> {
  key: keyof T;
  isAscending: boolean;
}

export interface MatchData {
  player1: string;
  player2: string;
  deckcode1: string;
  deckcode2: string;
  characters1: string;
  characters2: string;
  score1: number;
  score2: number;
  week_game: string;
  isDrop: boolean | null | "";
  isBye: boolean | null | "";
  isTie: boolean | null | "";
  isIncluded: boolean | null | "";
  isMirror: boolean;
  server: "AS" | "EU" | "NA";
  matchNum: number;
  week: number;
  game: number;
}

export interface PlayerData {
  player: string;
  deckcode: string;
  characters: string;
  server: "AS" | "EU" | "NA";
  week: number;
}

export interface PlayerDataWithResult extends PlayerData {
  w: number;
  t: number;
  l: number;
}

export interface DeckData {
  character1: string;
  character2: string;
  character3: string;
  characterId1: number;
  characterId2: number;
  characterId3: number;
  usage_player: number;
  usage_rate_player: number;
  best_result?: any; // This is not used in the code, but kept for compatibility
  bestW: number;
  bestT: number;
  bestL: number;
  n_top_deck: number;
  rate_top_deck: number;
  stderr_top_deck: number;
  usage_match: number;
  usage_rate_match: number;
  win_count: number;
  win_rate: number;
  stderr: number;
  win_count_nomirror: number;
  win_rate_nomirror: number;
  stderr_nomirror: number;
  tie_count: number;
}

export interface MajorData {
  max_players: number;
  players: MajorPlayer[];
  bracket: EliminationBracketMatch[]
}

export interface EliminationBracketMatch {
  top: number
  best_of: number
  matchid: number
  bans?: [number, number]
  games: MajorGame[]
}

export interface MajorGame {
  deck_index: [number, number]
  winner: 1 | 2
  vod?: string
}

export interface MajorPlayer {
  name: string
  seed: number
  uid: number
  deckcode: string[]
  avatar?: string
}

export type Seeding = [number, number][];