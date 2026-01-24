"use client";

import { useCsvPaste } from "@/hooks/useCsvPaste";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { getServerLabel } from "@/utils/server";
import { gameVersion, getVerLabel } from "@/utils/version";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function PlateOverlay() {
  let { data, error } = useLiveMatch();

  const csvPasteAPIRes = useCsvPaste(data?.weekly_uuid || "", true)

  const version = csvPasteAPIRes?.version ?? gameVersion.latest
  const week = csvPasteAPIRes?.week ?? 1
  const server = csvPasteAPIRes?.server ?? "as"
  const round = data?.round ?? 1

  const Logo = <img src={"/gitcg_weekly_logo.png"} className="object-none translate-y-[5.5px]" />

  const Plate = useMemo(() =>
    <div className="relative">
      <img src="/plate.png" className="object-none" />
      <p
        style={{
          textShadow: "1.5px 1.5px 0 black"
        }}
        className="genshin_font text-center text-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] text-white overflow-hidden"
      >
        {`${getVerLabel(version, "en")} ${getServerLabel(server, "en")}`}
        <br />
        {`Week ${week} ${round ? `Round ${round}` : ""}`}
      </p>
    </div>, [version, week, server, round]
  )

  const elements = [Logo, Plate];

  const [elementIndex, setElementIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElementIndex(prev => (prev + 1) % elements.length);
    }, 30000)

    return () => clearInterval(timer)
  }, [elements.length])

  if (error) return "Error: " + error;
  if (!data) return "Match loading";
  if (!csvPasteAPIRes) return "CSV loading";

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