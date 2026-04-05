"use client"

import { useLiveMajor } from "@/hooks/useLiveMatch"
import { useMajorCasterPredictionData, useMajorMetadataByUuid } from "@/hooks/useMajorData"
import { generateRoundStructure } from "@/utils/brackets"
import { getPlayer } from "@/utils/major"
import { notFound } from "next/navigation"
import { useState } from "react"

export default function MajorCasterPredictionOverlay () {
  const live = useLiveMajor()
    
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")
  const predictions = useMajorCasterPredictionData(live.data?.major_uuid || "")

  const [page, setPage] = useState(1)

  if(!live.data || !majorMetadata.data || !predictions.data) return "";

  const casters = majorMetadata.data.casters
  if(!casters) return "No casters assigned"

  const liveData = live.data
  const majorData = majorMetadata.data.content
  const predictionData = predictions.data
  const version = majorMetadata.data.version
  const server = majorMetadata.data.server

  const maxPage = Math.ceil(majorData.bracket.length/4)

  const liveMatch = majorData.bracket.find(m => m.matchid === liveData.match)
  const { seeding, games } = generateRoundStructure(majorData.max_players)

  if(!liveMatch || !seeding) notFound();

  return <div className="flex flex-col gap-4">
    <table className="custom">
      <thead>
        <tr>
          <td className="flex justify-center">
            <div
              style={{ boxShadow: "0 1.5px 0 black" }}
              className="mx-2 genshin_font text-[24px] text-center bg-[#fad38c] w-full p-0.5 mb-2 min-w-88 rounded-[5rem] overflow-hidden"
              onClick={() => setPage(prev => (prev % maxPage)+1 )}
            >
              Matches
            </div>
          </td>
          {casters.map(caster_user_id => <td key={caster_user_id}>
            <div style={{ boxShadow: "0 1.5px 0 black" }} className="mx-2 genshin_font text-[24px] text-center bg-[#fad38c] w-48 p-0.5 mb-2 rounded-[5rem] overflow-hidden">
              {(() => {
                switch(caster_user_id) {
                  case "4f642aae-cd1f-474d-b898-bc2f88a273b9": return "Coffin"
                  case "f15caf8e-bd2a-4eff-9505-7d9b279a6567": return "Kerching"
                  case "c197df31-b927-4fa3-8677-d470e1ee76cc": return "ersihfrans"
                }
              })()}
            </div>
          </td>)}
        </tr>
      </thead>

      <tbody>
      {majorData.bracket.slice(4*(page-1), 4*page).map((match, i) => {
          const player1 = getPlayer(match.matchid, 1, majorData, games, seeding)
          const player2 = getPlayer(match.matchid, 2, majorData, games, seeding)

          if(!player1 || !player2) return;

          return <tr key={match.matchid}>
            <td className="flex justify-center m-2">
              <div className="relative flex flex-row gap-2">
                <div className="absolute genshin_font italic text-[30px] top-full left-1/2 translate-x-[-57%] translate-y-[-100px]">
                  VS
                </div>

                <div className="flex flex-col gap-1.5 justify-center items-center">
                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-0.5 size-20 flex justify-center items-center">
                    <img src={`/major/${version}/avatar/${server}/${player1.seed}.png`} className="w-full rounded-[50%]" />
                  </div>

                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[18px] text-center bg-[#fad38c] w-36 p-0.5 mb-1 rounded-[5rem] overflow-hidden">
                    {player1.name}
                  </div>

                </div>

                <div className="flex flex-col gap-1.5 justify-center items-center">
                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-0.5 size-20 flex justify-center items-center">
                    <img src={`/major/${version}/avatar/${server}/${player2.seed}.png`} className="w-full rounded-[50%]" />
                  </div>

                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[18px] text-center bg-[#fad38c] w-36 p-0.5 mb-1 rounded-[5rem] overflow-hidden">
                    {player2.name}
                  </div>

                </div>
              </div>

            </td>

            {casters.map(caster_user_id => {
              const winner = predictionData.find(row => row.caster_user_id === caster_user_id && row.match_id === match.matchid)?.winner
              if(!winner) return <td key={caster_user_id}></td>;
              const winnerPlayer = winner === 1 ? player1 : player2
              
              return <td key={caster_user_id}>
                <div className="flex flex-col gap-1.5 justify-center items-center">
                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-0.5 size-20 flex justify-center items-center">
                    <img src={`/major/${version}/avatar/${server}/${winnerPlayer.seed}.png`} className="w-full rounded-[50%]" />
                  </div>

                  <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[18px] text-center bg-[#fad38c] w-36 p-0.5 mb-1 rounded-[5rem] overflow-hidden">
                    {winnerPlayer.name}
                  </div>

                </div>
              </td>
            })}

            
          </tr>
        })}
      </tbody>

    </table>
    {/* <div className="flex flex-col gap-1.5 justify-center items-center">
      <div style={{ boxShadow: "0 1.5px 0 black" }} className="bg-[#fad38c] rounded-[50%] p-0.5 size-20 flex justify-center items-center">
        <img src={`/major/${version}/avatar/${server}/1.png`} className="w-full rounded-[50%]" />
      </div>
      <div style={{ boxShadow: "0 1.5px 0 black" }} className="genshin_font text-[18px] text-center bg-[#fad38c] w-32 p-0.5 mb-1 rounded-[5rem] overflow-hidden">
        {majorData.players[4].name}
      </div>
    </div> */}
  </div>

}