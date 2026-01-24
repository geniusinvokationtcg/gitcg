import { supabaseServer } from "@/lib/supabaseServer";
import { csvPasteTransformHeader, parseCSV } from "@/utils/csvParse";
import { CsvPasteRow, CsvPasteRowClient, ServerPure } from "@/utils/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WeeklyData {
  id: number;
  uuid: string;
  version: string
  week: number
  server: ServerPure
  tournament_start: string;
  csv_link: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const uuid = searchParams.get("uuid")
  const version = searchParams.get("version")
  const week = Number(searchParams.get("week") ?? NaN)
  const server = searchParams.get("server") as ServerPure | null
  const nocsv = !!searchParams.get("nocsv")

  if (!uuid && (!version || Number.isNaN(week) || !server)) {
    return NextResponse.json(
      { error: "Bad request" },
      { status: 400 }
    )
  }

  let query = supabaseServer.from("weekly").select("*")

  if (uuid) {
    query = query.eq("uuid", uuid)
  } else {
    query = query
      .eq("version", version)
      .eq("week", week)
      .eq("server", server)
  }

  const { data, error } = await query.single<WeeklyData>();

  if (error || !data) {
    return NextResponse.json(
      { error: error ? error.message : "Not found" },
      { status: 404 }
    )
  }

  let csvPasteClient: CsvPasteRowClient[] = []

  if (!nocsv) {
    const csvPaste = await parseCSV<CsvPasteRow>(data.csv_link, { transformHeader: csvPasteTransformHeader })

    if (csvPaste.error) {
      return NextResponse.json(
        { error: csvPaste.error },
        { status: 404 }
      )
    }

    csvPasteClient = csvPaste.data.map(row => ({
      teamName: row.teamName,
      uid: row.uid,
      deckcode: row.deckcode,
      isCheckedIn: !!row.checkedInAt
    }))
  }

  return NextResponse.json({
    version: data.version,
    week: data.week,
    server: data.server,
    csvPaste: csvPasteClient
  }, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30"
    }
  })
}