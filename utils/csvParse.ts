import Papa from 'papaparse';
import { Maybe, SuccessResult, ErrorResult } from "./types";

export async function parseCSV<T>(
  url: string,
  config?: {}
): Promise<Maybe<T[]>> {
  config = {
    ...{
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    },
    ...config
  }
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

export async function parseCSVIgnoreErr<T>(
  url: string,
  config: {} = {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  }
): Promise<T[]> {
  const res = await fetch(url)
  const csvText = await res.text()
  const parsed = Papa.parse<T>(csvText, config)
  return parsed.data
}

export const csvPasteTransformHeader = (header: string) => {
  switch(header){
    case "UID": return "uid";
    case "Discord Username": return "discord_username";
    case "In-game Deck code": return "deckcode";
    case "PC Only: Stream Opt-In (Yes/No)": return "stream_opt_in";
    case "Pronouns": return "pronouns"
    default: return header;
  }
}