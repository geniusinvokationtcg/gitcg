import { supabase } from "@/lib/supabaseClient"
import { csvPasteTransformHeader, parseCSV } from "@/utils/csvParse"
import { getServerLabel } from "@/utils/server"
import { CsvPasteRow, CsvPasteRowClient, DuelistRecord, Locales, ServerPure } from "@/utils/types"
import { duelistRecordUrl, servers } from "@/utils/vars"
import { gameVersion, getVerLabel } from "@/utils/version"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { lazy, Suspense } from "react"

const DeckLeftPane = lazy(() => import("./obs/DeckLeftPane"));
const DeckSlideshow = lazy(() => import("./obs/DeckSlideshow"))
const DecklistDumpPageClient = lazy(() => import("./Client"));
const Plate = lazy(() => import("./obs/Plate"))

export interface DecklistDumpPageParams {
  locale: Locales
  version: string
  server: ServerPure
  week: number
}
interface DecklistDumpPageSearchParams {
  key?: string
  obs?: any
  top?: number
  bottom?: number
  round?: number
  msg?: string
}

export const revalidate = 60;

export async function generateMetadata ({ params }: { params: Promise<DecklistDumpPageParams> }) {
  const { locale, version, server, week } = await params
  const t = await getTranslations("DecklistDumpPage")

  const metadata = {
    title: t("title", {
      version: getVerLabel(version, locale),
      week: week,
      server: getServerLabel(server, locale) ?? ""
    }),
    description: t("description")
  }
  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default async function DecklistDumpPage ({ params, searchParams }: { params: Promise<DecklistDumpPageParams>, searchParams: Promise<DecklistDumpPageSearchParams> }) {
  try {
    let p = await params
    p.week = +p.week
    const { locale, version, server, week } = p

    if(!gameVersion.available.includes(version)) notFound();

    let q = await searchParams;
    if(q.top) q.top = +q.top;
    if(q.bottom) q.bottom = +q.bottom;
    const uuid = q.key;

    if(isNaN(week)) notFound()
    if(!servers.includes(server)) notFound()

    if(q.obs === "plate") return <Suspense>
      <Plate params={p} round={q.round} msg={q.msg}/>
    </Suspense>

    const _csvLink = await getCsvLink(version, week, server);

    const _tournamentStart = _csvLink.data?.tournament_start as string | undefined
    if(!_tournamentStart) notFound();
    const tournamentStart = new Date(_tournamentStart)
    const now = new Date()
    const isAdmin = _csvLink.data?.uuid === uuid
    if(tournamentStart > now && !isAdmin) notFound()

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

    const csvPasteClient: CsvPasteRowClient[] = csvPaste.filter(row => row.checkedInAt).map(row => ({
      teamName: row.teamName,
      uid: row.uid,
      deckcode: row.deckcode
    }))

    const t = await getTranslations("DecklistDumpPage")

    if(q.obs === "duel") return <Suspense>
      <DeckLeftPane
        params={p}
        csvPaste={csvPasteClient}
        duelistRecord={duelistRecord}
        top={q.top}
        bottom={q.bottom}
      />
    </Suspense>

    if(q.obs === "slideshow") return <Suspense>
      <DeckSlideshow
        params={p}
        csvPaste={csvPasteClient}
        duelistRecord={duelistRecord}
      />
    </Suspense>

    

    return <div className="max-w-[90vw] mx-auto mb-6 mt-3">
      <h1 className="mt-3 section_title">
        {t("title", {
          version: getVerLabel(version, locale),
          week: week,
          server: getServerLabel(server, locale) ?? ""
        })}
      </h1>
      <DecklistDumpPageClient
        params={p}
        csvPaste={csvPasteClient}
        duelistRecord={duelistRecord}
        isAdmin={isAdmin}
      />
    </div>

  } catch (e) {
    console.error(e)
    notFound()
  }
}

export async function getCsvLink(version: string, week: number, server: ServerPure) {
  return await supabase.from("weekly")
    .select("csv_link,tournament_start,uuid")
    .eq("version", version)
    .eq("week", week)
    .eq("server", server)
    .single()
}