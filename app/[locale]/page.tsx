'use client';

import gameVersion from "@/game-version.json"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function HomePage() {
  const t = useTranslations()

  usePageTitle(t("HomePage.title"));

  return <div className="p-8 min-w-screen">
    <div className="text-center text-4xl">{t("General.tournament_schedule")}</div>
    <div className="w-full my-6 flex justify-center">
      <img src={`/graphic/schedule/${gameVersion.latest}.png`} className="w-210 object-scale-down"/>
    </div>
    
  </div>
}

/* <div className="mb-2">
      <div className="absolute z-10">
        <img src="https://act-webstatic.hoyoverse.com/hk4e/e20200928calculate/item_icon/67c7f6fc/4034da62e0d3cb70574c1759e5c0ed28.png" width={160}></img>
      </div>
      <div className="relative z-20 pointer-events-none">
        <img src="https://raw.githubusercontent.com/ozansap/duel-saint/refs/heads/main/assets/border.png" width={160}></img>
      </div>
    </div> */