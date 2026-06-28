import { supabase } from "@/lib/supabaseClient"
import { unstable_cache } from "next/cache"
import { LeagueMatch, LeagueTeam } from "./types"

export const getSeasonName = (seasonId: string) => unstable_cache(
  async () => {
    return supabase.schema("league")
      .from("seasons")
      .select("name")
      .eq("season_id", seasonId)
      .single<{ name: string }>()
  },
  ["league-season", seasonId],
  {
    tags: [`league-season:${seasonId}`],
    revalidate: 86400
  }
)()

export const getMatch = (matchId: string) => unstable_cache(
  async () => {
    return supabase.schema("league")
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single<LeagueMatch>()
  },
  ["league-match", matchId],
  {
    tags: [`league-match:${matchId}`],
    revalidate: 86400
  }
)()

export const getTeams = (teamIds: string[]) => {
  const teamIdsKey = teamIds.toSorted().join(",")

  return unstable_cache(
    async () => {
      return supabase.schema("league")
        .from("teams")
        .select("*")
        .in("id", teamIds)
    },
    ["league-teams", teamIdsKey],
    {
      tags: [`league-teams:${teamIdsKey}`],
      revalidate: 86400
    }
  )()
}

export const getTeam = (teamId: string) => unstable_cache(
  async () => {
    return supabase.schema("league")
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single<LeagueTeam>()
  },
  ["league-team", teamId],
  {
    tags: [`league-team:${teamId}`],
    revalidate: 86400
  }
)()