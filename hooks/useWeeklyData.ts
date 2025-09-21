import { useEffect, useState } from "react";
import { parseCSV } from "@/utils/csvParse";
import { MatchData } from "@/utils/types";
import { weeklyMatchdataHeader } from "@/utils/vars";

export function useWeeklyData(version: string){
  const [parsedData, setParsedData] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const parsed = await parseCSV<MatchData>(`/weekly/${version}/matchdata.csv`, weeklyMatchdataHeader);
        
        if(parsed.error) setError(parsed.error);
        if(isMounted) setParsedData(parsed.data || []);
      }
      catch(e) {
        if(isMounted){
          console.error(e);
          setParsedData([]);
          setError(e instanceof Error ? e : new Error("Failed to load data"));
        }
      }
      finally {
        if(isMounted) setIsLoading(false);
      }
    }
    
    getData();
    return () => {isMounted = false};
  }, [version]);

  return { parsedData, isLoading, error };
}