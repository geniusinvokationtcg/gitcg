'use client';

import { MajorData, ServerPure } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";

const MAJOR_DATA_API = "https://script.google.com/macros/s/AKfycbxajfQ2Ncu8jSxh_ok_mlWvhy_HokptJBC6Huklm0HpLqNszNcWTELHvcHqdrhjEvUahA/exec";

export function useMajorData (version: string, server: ServerPure, isLive: boolean) {
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