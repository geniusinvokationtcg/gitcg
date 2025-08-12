'use client';

import { useEffect, useState } from "react";
import { MajorData } from "@/utils/types";
import { ServerPure } from "@/utils/types";

export function useMajorData (version: string, server: ServerPure) {
  const [data, setData] = useState<MajorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const getData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/major/${version}/${server}.json`);
        if(!res.ok) setError(new Error(`Failed to load data: ${res.status} ${res.statusText}`));
        const json = await res.json();
        if(isMounted) setData(json || null);
      }
      catch(e) {
        if(isMounted){
          console.error(e);
          setData(null);
          setError(e instanceof Error ? e : new Error("Failed to load data"));
        }
      }
      finally {
        if(isMounted) setIsLoading(false);
      }
    }
    
    getData();
    return () => {isMounted = false};
  }, [version, server]);

  return { data, isLoading, error };
}