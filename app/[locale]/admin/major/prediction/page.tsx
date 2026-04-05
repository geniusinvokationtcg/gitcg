"use client"

import { CustomSelect } from "@/components/Dropdown";
import { useAuth } from "@/context/Auth";
import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid, useMajorCasterPredictionData } from "@/hooks/useMajorData";
import { supabase } from "@/lib/supabaseClient";
import { generateRoundStructure } from "@/utils/brackets";
import { getPlayer } from "@/utils/major";
import { getServerLabel } from "@/utils/server";
import { getVerLabel } from "@/utils/version";
import { notFound, redirect, usePathname } from "next/navigation";
import { useState } from "react";

export default function LiveMatchEditor() {
  const auth = useAuth()
  const pathname = usePathname()

  if(!auth.user && !auth.isLoading) redirect(`/account/login?redirect=${pathname}`)
  if(!auth.isAdmin && !auth.isLoading) notFound()

  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")
  const predictions = useMajorCasterPredictionData(live.data?.major_uuid || "")

  const [isUpdating, setIsUpdating] = useState(false)

  if(live.error) return live.error
  if(majorMetadata.error) return majorMetadata.error
  if(predictions.error) return predictions.error

  if(!live.data || !majorMetadata.data || !predictions.data) return "Loading";

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const predictionData = predictions.data
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server

  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const { seeding, games } = generateRoundStructure(majorData.max_players)

  // const round = games.findIndex(r => r.includes(liveMatch?.matchid || 1)) || 0

  if(!liveMatch || !seeding) notFound();

  return <div className="flex flex-col gap-4 my-4 mx-4">
    <h1 className="section_title">
      {`${getVerLabel(version, "en")} ${getServerLabel(server, "en")} Major Caster Prediction`}
    </h1>

    <table className={`text-sm ${isUpdating ? "ui-disabled" : ""}`}>
      <thead>
        <tr>
          <th>Match</th>
          <th>Players</th>
          <th>Predict the Winner</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: majorData.max_players-1 }, (_, i) => {
          const matchid = i+1;

          const player1 = getPlayer(matchid, 1, majorData, games, seeding)?.name || "TBD"
          const player2 = getPlayer(matchid, 2, majorData, games, seeding)?.name || "TBD"

          return <tr key={i}>
            
            <td>{matchid}</td>

            <td>
              {player1}
              <br/>
              vs
              <br/>
              {player2}
            </td>

            <td className="flex justify-center">
              <CustomSelect
                options={[
                  { value: 0, label: "Deselect"},
                  { value: 1, label: player1 },
                  { value: 2, label: player2 }
                ]}
                value={
                  (() => {
                    const player = predictionData.find(row => row.caster_user_id === auth.user?.id && row.match_id === matchid)?.winner
                    return player ? (getPlayer(matchid, player, majorData, games, seeding)?.name ?? "Choose") : "Choose"
                  })()
                }
                onChange={async (e: 0 | 1 | 2) => {
                  setIsUpdating(true)

                  let winner: null | 1 | 2 = e || null
                  const { error } = await supabase
                    .schema("major")
                    .from("caster_prediction")
                    .upsert(
                      {
                        major_uuid: liveData.major_uuid,
                        caster_user_id: auth.user?.id,
                        match_id: matchid,
                        winner: winner
                      },
                      {
                        onConflict: "major_uuid,caster_user_id,match_id"
                      }
                    )
                  
                  if (error) {
                    alert("Error: "+error)
                  }

                  setIsUpdating(false)
                }}
              />
            </td>

          </tr>
        })}
      </tbody>
    </table>
  </div>
}