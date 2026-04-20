import Papa from 'papaparse';
import { Maybe, SuccessResult, ErrorResult } from "./types";

const cache = new Map<string, { data: any; expiry: number }>();

export async function parseCSV<T>(
  url: string,
  config?: {}
): Promise<Maybe<T[]>> {
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && cached.expiry > now) {
    return SuccessResult(cached.data);
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 }
    });
    if(!res.ok) return ErrorResult(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    const csvText = await res.text();
    const parsed = Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      ...config
    });
    if(parsed.errors.length > 0) return ErrorResult(parsed.errors[0].message);
    
    cache.set(url, {
      data: parsed.data,
      expiry: now + 600_000
    });

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
    case "In-game Deck code":
    case "Deck code":
      return "deckcode";
    case "PC Only: Stream Opt-In (Yes/No)": return "stream_opt_in";
    case "Pronouns": return "pronouns"
    default: return header;
  }
}