'use client';

import { supabase } from "@/lib/supabaseClient";
import { MajorData, ServerPure } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const MAJOR_DATA_API = "https://script.google.com/macros/s/AKfycbxajfQ2Ncu8jSxh_ok_mlWvhy_HokptJBC6Huklm0HpLqNszNcWTELHvcHqdrhjEvUahA/exec";

interface MajorDataSupabase {
  tournament_start: string
  content: MajorData
}

export function useMajorData (version: string, server: ServerPure, isLive: boolean) {
  const [data, setData] = useState<MajorData | null | undefined>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.from("major")
        .select("tournament_start,content")
        .eq("version", version)
        .eq("server", server)
        .single<MajorDataSupabase>()

      if (cancelled) return;

      if (error) {
        setError(error.message)
        setData(null)
      } else {
        setError(null)
        setData(data.content)
      }

      setIsLoading(false)
    }

    fetchData()

    return () => { cancelled = true }
  }, [version, server])

  useEffect(() => {
    const channel = supabase.channel("major")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "major", filter: `version=eq.${version}` },
        (payload) => {
          if(payload.new.server === server) setData(payload.new.content as MajorData)
        }
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [version, server])

  const majorDataQuery = useQuery({
    queryKey: [`major_${version}_${server}`],
    queryFn: async () => {
      const res = await fetch(`/major/${version}/${server}.json`);
      const json = await res.json();
      return json as MajorData | null
    },
    enabled: !!error
  })

  useEffect(() => {
    if(error) {
      setData(majorDataQuery.data)
      setError(majorDataQuery.error?.message || "Unknown error")
      setIsLoading(majorDataQuery.isLoading)
    }
  }, [error, majorDataQuery])

  return {data, isLoading, error}
}

interface MajorMetadataSupabase {
  id: number
  major_uuid: string
  created_at: string
  version: string
  server: ServerPure
  tournament_start: string
  content: MajorData
  prediction: MajorCasterPrediction
}

export function useMajorMetadataByUuid (major_uuid: string) {
  const [data, setData] = useState<MajorMetadataSupabase | null | undefined>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.from("major")
        .select("*")
        .eq("uuid", major_uuid)
        .single<MajorMetadataSupabase>()

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
  }, [major_uuid])

  useEffect(() => {
    const channel = supabase.channel("major")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "major", filter: `uuid=eq.${major_uuid}` },
        (payload) => {
          setData(payload.new as MajorMetadataSupabase)
        }
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [major_uuid])

  return {data, isLoading, error}
}

export function useMajorCasterPredictionData (major_uuid: string) {
  interface MajorCasterPredictionData {
    id: number
    major_uuid: string
    caster_user_id: string
    match_id: number
    winner: 1 | 2
  }

  const [data, setData] = useState<MajorCasterPredictionData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .schema("major")
        .from("caster_prediction")
        .select("*")
        .eq("major_uuid", major_uuid)

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
  }, [major_uuid])

  useEffect(() => {
    const channel = supabase.channel("caster_prediction")
      .on(
        "postgres_changes",
        { event: "*", schema: "major", table: "caster_prediction", filter: `major_uuid=eq.${major_uuid}` },
        (payload) => {
          const newRow = payload.new as MajorCasterPredictionData

          if (payload.eventType === "INSERT") {
            setData(prev => (prev ? [...prev, newRow] : [newRow]));
          }

          if (payload.eventType === "UPDATE") {
            setData(prev =>
              !prev ? [newRow] : prev.map(row =>
                row.match_id === payload.new.match_id &&
                row.caster_user_id === payload.new.caster_user_id
                  ? newRow
                  : row
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setData(prev =>
              !prev ? [newRow] : prev.filter(row =>
                !(
                  row.match_id === payload.old.match_id &&
                  row.caster_user_id === payload.old.caster_user_id
                )
              )
            );
          }
        }
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [major_uuid])

  return {data, isLoading, error}
}

export function useMajorDataOld (version: string, server: ServerPure, isLive: boolean) {
  const majorDataQuery = useQuery({
    queryKey: [`major_${version}_${server}`],
    queryFn: async () => {
      const res = await fetch(isLive ? MAJOR_DATA_API : `/major/${version}/${server}.json`);
      const json = await res.json();
      return (isLive ? json.data : json) as MajorData | null
    },
    refetchInterval: isLive ? 10000 : false
    
  })
  
  return majorDataQuery;
}

interface MajorCasterPrediction {
  casters: string[]
  predictions: {
    user_id: string
    prediction: {
      winner: 1 | 2
      matchid: number
    }[]
  }[]
}
