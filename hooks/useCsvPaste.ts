import { CsvPasteRowClient, ServerPure } from "@/utils/types";
import { useEffect, useState } from "react";

interface CsvPasteAPIRes {
  version: string
  week: number
  server: ServerPure
  csvPaste: CsvPasteRowClient[]
}

export function useCsvPaste (uuid: string, nocsv?: boolean) {
  const [csvPaste, setCsvPaste] = useState<CsvPasteAPIRes | null>(null)
  
  useEffect(() => {
    let cancelled = false

    if(!uuid) return () => { cancelled = true };

    async function load() {
      const res = await fetch(`/api/weekly?uuid=${uuid}${nocsv ? "&nocsv=1" : ""}`)
      if(!res.ok) {
        console.error("API call failed")
        return
      }

      const data = await res.json()
      if(!cancelled) setCsvPaste(data)
    }

    load()

    return () => { cancelled = true }
  }, [uuid])

  return csvPaste
}