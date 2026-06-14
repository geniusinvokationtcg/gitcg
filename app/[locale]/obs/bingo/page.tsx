"use client"

import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

export default function BingoLivePage() {
  const bingo = useLiveBingo()

  if (bingo.isLoading) return <div>Loading...</div>
  if (bingo.data.length === 0) notFound()

  let bingoRows: BingoTile[][] = []
  for (let i = 0; i < bingo.data.length; i += 5) {
    bingoRows = [...bingoRows, bingo.data.slice(i, i + 5)]
  }

  const completedLineIds = new Set<number>()

  // Rows
  for (let row = 0; row < 5; row++) {
    const tiles = bingo.data.slice(row * 5, row * 5 + 5)

    if (tiles.every(tile => tile.is_done)) {
      tiles.forEach(tile => completedLineIds.add(tile.id))
    }
  }

  // Columns
  for (let col = 0; col < 5; col++) {
    const tiles = Array.from(
      { length: 5 },
      (_, row) => bingo.data[row * 5 + col]
    )

    if (tiles.every(tile => tile.is_done)) {
      tiles.forEach(tile => completedLineIds.add(tile.id))
    }
  }

  // Main diagonal
  const diag1 = Array.from(
    { length: 5 },
    (_, i) => bingo.data[i * 5 + i]
  )

  if (diag1.every(tile => tile.is_done)) {
    diag1.forEach(tile => completedLineIds.add(tile.id))
  }

  // Anti-diagonal
  const diag2 = Array.from(
    { length: 5 },
    (_, i) => bingo.data[i * 5 + (4 - i)]
  )

  if (diag2.every(tile => tile.is_done)) {
    diag2.forEach(tile => completedLineIds.add(tile.id))
  }

  return <div style={{ width: 640, height: 640 }} className="text-[17px] text-center text-black font-bold">
    <table className="custom">
      <tbody>
        {bingoRows.map((row, i) => (
          <tr key={i}>
            {row.map(tile => (
              <td key={tile.id} className={`border-2 border-black p-1 w-32 h-32 ${completedLineIds.has(tile.id) ? "bg-green-300" : tile.is_done ? "bg-green-100" : ""} transition-all duration-300`}>
                {tile.tile}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
}

export interface BingoTile {
  id: number
  tile: string
  is_done: boolean
}

export function useLiveBingo() {
  const [data, setData] = useState<BingoTile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.from("bingo")
        .select("*")
        .in("id", Array.from({ length: 25 }, (_, i) => i + 1))
        .order("id")
      console.log(data)

      if (cancelled) return;

      if (error) {
        setError(error.message)
        setData([])
      } else {
        setError(null)
        setData(data)
      }

      setIsLoading(false)
    }

    fetchData()

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const channel = supabase.channel("bingo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo" },
        (payload) => {
          const updatedTile = payload.new as BingoTile
          setData(current => current.map(tile => tile.id === updatedTile.id ? updatedTile : tile))
        }
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, error, isLoading }
}