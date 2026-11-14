"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function useWheelNames() {
  const [names, setNames] = useState<string>("");

  useEffect(() => {
    async function fetchNames() {
      const { data, error } = await supabase
        .from("wheel")
        .select("names")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Failed to fetch wheel:", error);
        return;
      }

      setNames(data.names);
    }

    fetchNames();

    // Subscribe to changes
    const channel = supabase
      .channel("wheel-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wheel",
          filter: "id=eq.1",
        },
        (payload) => {
          setNames(payload.new.names as string);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return names
}