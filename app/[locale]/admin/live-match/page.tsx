"use client"

import { CustomButton } from "@/components/Button";
import { CustomSelect } from "@/components/Dropdown";
import { useAuth } from "@/context/Auth";
import { useCsvPaste } from "@/hooks/useCsvPaste";
import { LiveMatchData, useLiveMatch } from "@/hooks/useLiveMatch";
import { supabase } from "@/lib/supabaseClient";
import { notFound, redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LiveMatchEditor() {
  const auth = useAuth()
  const pathname = usePathname()

  if(!auth.user && !auth.isLoading) redirect(`/account/login?redirect=${pathname}`)
  if(!auth.isAdmin && !auth.isLoading) notFound()

  const { data, error, isLoading } = useLiveMatch();

  const [currentMatch, setCurrentMatch] = useState<LiveMatchData | null>(null)
  const [editedMatch, setEditedMatch] = useState<LiveMatchData | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const csvPasteAPIRes = useCsvPaste(data?.weekly_uuid || "")

  useEffect(() => {
    setCurrentMatch(data)
  }, [data])

  if (isLoading) return "Retrieving database"
  if (!data) return <div>Live match detail can't be retrieved <br /> {`Error: ${error ?? "Unknown error"}`}</div>
  if (!currentMatch) return "Mounting current match data"
  if (csvPasteAPIRes.isLoading) return "Loading CSV"
  if (!csvPasteAPIRes.csvPaste) return "CSV paste from Google Sheet can't be retrieved"

  const { csvPaste } = csvPasteAPIRes.csvPaste

  const playerOptions = csvPaste.sort((a, b) => a.teamName.localeCompare(b.teamName)).map(row => ({
    value: row.uid,
    label: <div>
      <span style={{ fontSize: "16px" }}>{row.teamName + " "}</span>
      <span style={{ fontSize: "13px" }}>{`(${row.uid})`}</span>
    </div>
  }))

  const roundOptions = [1, 2, 3, 4, 5].map(round => ({ value: round, label: round }))

  return <div className="flex flex-col gap-2 p-4">
    <div className="break-all monospaced">{JSON.stringify(currentMatch)}</div>
    <div className="break-all monospaced">{JSON.stringify(editedMatch)}</div>

    <div className={`flex flex-col gap-1 ${isEditing ? "" : "pointer-events-none opacity-50"}`}>
      <div className="pt-4 flex flex-row w-full gap-2">
        <div className="flex flex-col gap-1 w-1/2 items-center">
          <div className="text-sm font-bold">First Player</div>
          <div className="flex flex-col w-full">
            <CustomSelect
              options={playerOptions}
              value={isEditing ? editedMatch?.first_player_uid ?? "Edited match is unmounted" : currentMatch.first_player_uid}
              onChange={(value) => editedMatch ? setEditedMatch({ ...editedMatch, first_player_uid: Number(value) }) : console.log("Edited match is unmounted")}
              additionalClass={"w-full"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 w-1/2 items-center">
          <div className="text-sm font-bold">Second Player</div>
          <div className="flex flex-col w-full">
            <CustomSelect
              options={playerOptions}
              value={isEditing ? editedMatch?.second_player_uid ?? "Edited match is unmounted" : currentMatch.second_player_uid}
              onChange={(value) => editedMatch ? setEditedMatch({ ...editedMatch, second_player_uid: Number(value) }) : console.log("Edited match is unmounted")}
              additionalClass={"w-full"}
            />
          </div>
        </div>

      </div>

      <div className="flex flex-row gap-1 align-middle items-center">
        <div className="text-sm font-bold">Round: </div>
        <CustomSelect
          options={roundOptions}
          value={isEditing ? editedMatch?.round ?? "Unmounted" : currentMatch.round}
          onChange={(value) => editedMatch ? setEditedMatch({ ...editedMatch, round: Number(value) }) : console.log("Edited match is unmounted")}
          additionalClass={"w-full"}
        />
      </div>
    </div>

    <div className="flex flex-row gap-2 justify-end">
      <CustomButton
        buttonText={isEditing ? "You're editing. Remember to save." : "Edit"}
        onClick={() => {
          setIsEditing(true)
          setEditedMatch(currentMatch)
        }}
        disabled={isEditing}
      />
      <CustomButton
        buttonText="Save"
        onClick={async () => {
          const { data, error } = await supabase
            .from("live_match")
            .update(editedMatch)
            .eq("id", 1)
            .select()

          if (error) {
            console.error(error)
            alert(error.message)
          } else if (!data || data.length === 0) {
            alert("Access denied")
          } else {
            alert("Saved!")
          }
          setIsEditing(false)
          setEditedMatch(null)
        }}
      />
    </div>

  </div>
}