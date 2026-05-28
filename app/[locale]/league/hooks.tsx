"use client"

import { supabase } from "@/lib/supabaseClient"
import { LeagueSeason, LeagueTeam, LeaguePlayer, LeagueMatch, LeagueGame } from "./types"
import { useEffect, useState } from "react"

export function useSeasonData() {
  const [data, setData] = useState<LeagueSeason[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      const { data, error } = await supabase.schema("league")
        .from("seasons")
        .select("*")

       if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [])

  return { data, isLoading, error }
}

export function useTeamData(season: string) {
  const [data, setData] = useState<LeagueTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      const { data, error } = await supabase.schema("league")
        .from("teams")
        .select("*")
        .eq("season_id", season)

      if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [season])

  return { data, isLoading, error }
}

export function usePlayerData(teamIds: string[]) {
  const [data, setData] = useState<LeaguePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      if (teamIds.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.schema("league")
        .from("players")
        .select("*")
        .in("team_id", teamIds)

        if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [teamIds.join(",")])

  return { data, isLoading, error }
}

export function useMatchData(teamIds: string[]) {
  const [data, setData] = useState<LeagueMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      if (teamIds.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.schema("league")
        .from("matches")
        .select("*")
        .or(`team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`)

        if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [teamIds.join(",")])

  return { data, isLoading, error }
}

export function useGameDataByPlayer(playerIds: string[]) {
  const [data, setData] = useState<LeagueGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      if (playerIds.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.schema("league")
        .from("games")
        .select("*")
        .or(`player_a_id.in.(${playerIds.join(",")}),player_b_id.in.(${playerIds.join(",")})`)

        if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [playerIds.join(",")])

  return { data, isLoading, error }
}

export function useGameDataByMatch(matchIds: string[]) {
  const [data, setData] = useState<LeagueGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      if (matchIds.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.schema("league")
        .from("games")
        .select("*")
        .in("match_id", matchIds)

        if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

  }, [matchIds.join(",")])

  return { data, isLoading, error }
}