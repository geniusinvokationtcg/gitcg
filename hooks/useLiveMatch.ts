"use client"

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

interface LiveMatchData {
  id: number
  weekly_uuid: string
  first_player_uid: number
  second_player_uid: number
  round: number
}

export function useLiveMatch () {
  const [data, setData] = useState<LiveMatchData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("live_match")
      .select("*")
      .eq("id", 1)
      .single<LiveMatchData>()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setData(data);
      })
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

  return { data, error }
}