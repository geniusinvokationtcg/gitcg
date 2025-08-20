'use client';

import { notFound, useSearchParams } from "next/navigation";
import gameVersion from "@/game-version.json"
import { use, useState } from "react"
import { useTranslations } from "next-intl";
import { useTranslatedServers } from "@/hooks/useTranslatedServers";
import { useMajorData } from "@/hooks/useMajorData";
import { useCopiedPopUp } from "@/hooks/utilities";
import { CardImageMedium } from "@/components/CardImage";
import { CustomButton } from "@/components/Button";
import { SuccessNotification } from "@/components/PopUp";
import { ServerPure } from "@/utils/types";
import { getCardImageUrl, getCardName } from "@/utils/cards";
import { decodeAndSortActionCards } from "@/utils/decoder";
import { handleCopy } from "@/utils/clipboard";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function MajorPlayerDetail ({ params }: { params: Promise<{ locale: string; version: string; server: ServerPure; seed: number }> }) {
  const { locale, version, server } = use(params);
  let { seed } = use(params); seed = Number(seed);
  const majorMetadata = gameVersion.major.find(i => i.version === version);
  if(!majorMetadata) notFound();
  if(majorMetadata.server.indexOf(server) < 0) notFound();
  const g = useTranslations("General");
  const t = useTranslations("MajorRecap");

  const searchParams = useSearchParams();
  const d = searchParams.get("d")
  const [deckIndex, setDeckIndex] = useState<number>(isNaN(Number(d)) ? 0 : Number(d));

  const serverList = useTranslatedServers(); 
  const serverName = serverList.find(s => s.value === server)?.label || server.toUpperCase();

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp();
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false);

  const { data, isLoading, error } = useMajorData(version, server);
  if(isLoading) return;
  if(!data) return <p>Something went wrong: {error ? error.message : "Unknown error"}</p>

  const player = data.players.find(p => p.seed === seed)
  if(!player) notFound()
  
  const title = t("player_title", {
    version: version,
    server: serverName || server.toUpperCase(),
    seed: seed
  })
  
  document.title = `${player.name} | ${title}`
  
  const decklists = player.deckcode.map(code => {
    const decoded = decodeAndSortActionCards(code)
    const characterCards = decoded.splice(0, 3)
    return {
      deckcode: code,
      character_cards: characterCards,
      action_cards: decoded
    }
  })
  // const decoded = decodeAndSortActionCards(player.deckcode[deckIndex])
  // const characterCards = decoded.splice(0, 3)
  // const actionCards = decoded

  return <div className="max-w-220 mx-auto pb-3">
    <h1 className="deck_showcase_padding mt-3 section_title">
      {title}
    </h1>
    <h1 className="deck_showcase_padding section_title font-semibold">
      {player.name}
    </h1>
    <div className="deck_showcase_padding section_title">{g("decklist")}</div>
    <div className="page_control px-3 pt-0.5">
      <ChevronLeftIcon className={deckIndex === 0 ? "disabled" : ""} onClick={ () => {if(deckIndex > 0) setDeckIndex(i => i-1)} }/>
      <span>{`${deckIndex+1}/${player.deckcode.length}`}</span>
      <ChevronRightIcon className={deckIndex === player.deckcode.length-1 ? "disabled" : ""} onClick={ () => {if(deckIndex < player.deckcode.length-1) setDeckIndex(i => i+1)} }/>
    </div>
    <div className="deck_showcase_padding character_cards_large">
      <span className="card_image_large">
        <img src={getCardImageUrl("characters", decklists[deckIndex].character_cards[0], "id")} title={getCardName(decklists[deckIndex].character_cards[0], "characters", locale)}></img>
        <img src="/borders/normal.png"></img>
      </span>
      <span className="card_image_large">
        <img src={getCardImageUrl("characters", decklists[deckIndex].character_cards[1], "id")} title={getCardName(decklists[deckIndex].character_cards[1], "characters", locale)}></img>
        <img src="/borders/normal.png"></img>
      </span>
      <span className="card_image_large">
        <img src={getCardImageUrl("characters", decklists[deckIndex].character_cards[2], "id")} title={getCardName(decklists[deckIndex].character_cards[2], "characters", locale)}></img>
        <img src="/borders/normal.png"></img>
      </span>
    </div>
    <div className="deck_showcase_padding flex gap-1.5 justify-center flex-wrap">
      {decklists[deckIndex].action_cards.map((c, index) => (
        <CardImageMedium
          key={index}
          cardType="actions"
          cardId={c}
          locale={locale}
        />
      ))}
    </div>
    { showDeckcode && <div className={"mx-3 mt-1.5 text-center monospaced select-all break-all"}>
      {decklists[deckIndex].deckcode}
    </div> }
    <div className="px-3 pt-1.5 flex justify-center mx-auto gap-1.5">
      <CustomButton
        buttonText={g("copy_deckcode")}
        onClick={() => handleCopy(decklists[deckIndex].deckcode, copiedPopUpTrigger)}
      />
      <CustomButton
        buttonText={showDeckcode ? g("hide_deckcode") : g("show_deckcode")}
        onClick={() => setShowDeckcode(!showDeckcode)}
      />
      <SuccessNotification show={showNotification} text={g("copied")} />
    </div>
  </div>
}