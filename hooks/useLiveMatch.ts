"use client"

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export interface LiveMatchData {
  id: number
  weekly_uuid: string
  first_player_uid: number
  second_player_uid: number
  round: number
}

export function useLiveMatch() {
  const [data, setData] = useState<LiveMatchData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.from("live_match")
        .select("*")
        .eq("id", 1)
        .single<LiveMatchData>()

      if (cancelled) return;

      if (error) {
        setError(error.message)
        setData(null)
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const channel = supabase.channel("live_match")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_match", filter: "id=eq.1" },
        (payload) => setData(payload.new as LiveMatchData)
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, error, isLoading }
}