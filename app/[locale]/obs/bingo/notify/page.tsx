"use client"

import { BingoTile } from "../page"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AnimatePresence, motion } from "framer-motion"

export default function BingoTileNotificationLivePage() {
  const [notification, setNotification] = useState<BingoTile | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("/sounds/bingo.mp3")
  }, [])

  useEffect(() => {
    const channel = supabase.channel("bingo-notification")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo" },
        (payload) => {
          const oldTile = payload.old as BingoTile
          const newTile = payload.new as BingoTile

          if (!oldTile.is_done && newTile.is_done) {
            setNotification(newTile)
            audioRef.current?.play().catch(console.error)
            setTimeout(() => setNotification(current => current?.id === newTile.id ? null : current), 10000)
          }
        }
      )
      .subscribe(status => console.log(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div style={{ width: 280, height: 200 }}>
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
            duration: 0.3,
            ease: "easeOut",
          }}
          className="relative flex justify-center items-center genshin_font min-w-screen min-h-screen text-[#6C3C16] text-[18px] leading-snug"
        >
          <img src="/assets/catbox.png" />
          <div className="absolute flex justify-center items-center w-60 h-20 p-1 text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%-17px)]">
            {`BINGO: ${notification.tile}`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
}
