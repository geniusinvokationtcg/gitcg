import { supabase } from "@/lib/supabaseClient"
import { csvPasteTransformHeader, parseCSV } from "@/utils/csvParse"
import { getServerLabel } from "@/utils/server"
import { CsvPasteRow, DuelistRecord, Locales, ServerPure } from "@/utils/types"
import { duelistRecordUrl, servers } from "@/utils/vars"
import { getVerLabel } from "@/utils/version"
import { notFound } from "next/navigation"
import { DecklistDumpPageClient } from "./Client"

export interface DecklistDumpPageParams {
  locale: Locales
  version: string
  server: ServerPure
  week: number
}

export const revalidate = 60;

export default async function DecklistDumpPage ({ params }: { params: Promise<DecklistDumpPageParams> }) {
  try {
    let p = await params
    p.week = +p.week
    const { locale, version, server, week } = p

    if(isNaN(week)) notFound()
    if(!servers.includes(server)) notFound()

    const _csvLink = await supabase.from("weekly")
      .select("csv_link")
      .eq("version", version)
      .eq("week", week)
      .eq("server", server)
      .single()

    const csvLink = _csvLink.data?.csv_link as string | undefined | null
    if(!csvLink) notFound();

    const [csvPastePromise, DRPromise] = await Promise.allSettled([
      parseCSV<CsvPasteRow>(csvLink, { transformHeader: csvPasteTransformHeader }),
      parseCSV<DuelistRecord>(duelistRecordUrl)
    ])

    if(csvPastePromise.status !== "fulfilled") {
      console.error(csvPastePromise.reason)
      notFound()
    }
    if(csvPastePromise.value.error) {
      console.error(csvPastePromise.value.error)
      notFound()
    }

    const csvPaste = csvPastePromise.value.data
    const duelistRecord = (DRPromise.status === "fulfilled" ? DRPromise.value.data : null) ?? []

    return <div className="max-w-[90vw] mx-auto mb-6 mt-3">
      <div className="mt-3 section_title">GITCG {getVerLabel(version, locale)} Week {week} {getServerLabel(server, locale)} Decklist Dump</div>
      <DecklistDumpPageClient
        params={p}
        csvPaste={csvPaste}
        duelistRecord={duelistRecord}
      />
    </div>

  } catch (e) {
    console.error(e)
    notFound()
  }

  // return new Intl.DateTimeFormat("id", {
  //   dateStyle: "medium",
  //   timeStyle: "short"
  // }).format(new Date(b.tournament_start))
}