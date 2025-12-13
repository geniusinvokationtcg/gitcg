"use client"

import { getServerLabel } from "@/utils/server";
import { DecklistDumpPageParams } from "../page";
import { getVerLabel } from "@/utils/version";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Plate ({ params, round }: { params: DecklistDumpPageParams, round?: number }) {
  const { locale, version, server, week } = params;
  
  const Logo = <img src={"/gitcg_weekly_logo.png"} className="object-none translate-y-[5.5px]"/>
  
  const Plate = useMemo(() =>
    <div className="relative">
      <img src="/plate.png" className="object-none" />
      <p
        style={{
          textShadow: "1.5px 1.5px 0 black"
        }}
        className="genshin_font text-center text-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] text-white overflow-hidden"
      >
        {`${getVerLabel(version, locale)} ${getServerLabel(server, locale)}`}
        <br/>
        {`Week ${week} ${round ? `Round ${round}` : ""}`}
      </p>
    </div>, [params, round]
  )

  const elements = [Logo, Plate];

  const [elementIndex, setElementIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElementIndex(prev => (prev + 1) % elements.length);
    }, 30000)

    return () => clearInterval(timer)
  }, [elements.length])

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