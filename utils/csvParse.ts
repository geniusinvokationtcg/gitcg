import Papa from 'papaparse';
import { Maybe, SuccessResult, ErrorResult } from "./types";

export async function parseCSV<T>(
  url: string,
  config: {}
): Promise<Maybe<T[]>> {
  try {
    const res = await fetch(url);
    if(!res.ok) return ErrorResult(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    const csvText = await res.text();
    const parsed = Papa.parse<T>(csvText, config);
    if(parsed.errors.length > 0) return ErrorResult(parsed.errors[0].message);
    return SuccessResult(parsed.data);
  }
  catch(e){
    return ErrorResult(e instanceof Error ? e.message : "Failed to load data");
  }
}