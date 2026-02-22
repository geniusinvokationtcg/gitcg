"use client"

import { useLiveMajor } from "@/hooks/useLiveMatch";
import { useMajorMetadataByUuid } from "@/hooks/useMajorData";
import { generateRoundStructure } from "@/utils/brackets";
import { getRoundNameKey } from "@/utils/major";
import { getServerLabel } from "@/utils/server";
import { ServerPure } from "@/utils/types";
import { gameVersion, getVerLabel } from "@/utils/version";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function MajorPlateOverlay () {
  const t = useTranslations("MajorRecap");
    
  const live = useLiveMajor()
  
  const majorMetadata = useMajorMetadataByUuid(live.data?.major_uuid || "")

  const liveData = live.data
  const majorData = majorMetadata.data?.content
  const version = majorMetadata.data?.version || gameVersion.major[0].version
  const server = majorMetadata.data?.server || gameVersion.major[0].server[0] as ServerPure
  
  const liveMatch = majorData?.bracket.find(m => m.matchid === liveData?.match)
  const { seeding, games } = generateRoundStructure(majorData?.max_players || 8)

  const round = games.findIndex(r => r.includes(liveMatch?.matchid || 1)) || 0

  const Logo = <img src={`/gitcg_major_${server}_logo.png`} className="object-fit h-[160px] translate-x-0" />

  const Plate = useMemo(() =>
    <div className="relative">
      <img src="/plate.png" className="object-none" />
      <p
        style={{
          textShadow: "1.5px 1.5px 0 black"
        }}
        className="genshin_font text-center text-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] text-white overflow-hidden"
      >
        {`${getVerLabel(version, "en")} ${getServerLabel(server, "en")} Major`}
        <br />
        {`${t(getRoundNameKey(games[round].length*2), { top: games[round].length*2 })} | Match ${liveData?.match || ""} | Game ${liveData?.game || ""}`}
      </p>
    </div>, [version, server, liveData]
  )

  const elements = [Logo, Plate];
  
  const [elementIndex, setElementIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElementIndex(prev => (prev + 1) % elements.length);
    }, 30000)

    return () => clearInterval(timer)
  }, [elements.length])

  if(!live.data || !majorMetadata.data) return "Loading";
  if(!liveMatch || !seeding) return "Loading"

  return <div style={{ background: "transparent", width: 548 }} className="flex flex-col justify-center items-center">
    <AnimatePresence mode="wait">
      <motion.div
        key={elementIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className=""
      >
        {elements[elementIndex]}
      </motion.div>
    </AnimatePresence>
  </div>
}