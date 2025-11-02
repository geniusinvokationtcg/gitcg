"use client"

import { CsvPasteRow, CsvPasteRowClient, DuelistRecord, Tuple } from "@/utils/types";
import { DecklistDumpPageParams } from "./page";
import { useState } from "react";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { getCardName } from "@/utils/cards";
import { LineupShowcaseForTable } from "@/components/Table";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { CustomButton } from "@/components/Button";
import { ClipboardDocumentIcon, XMarkIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from "@heroicons/react/24/outline";
import { useCopiedPopUp } from "@/hooks/utilities";
import { handleCopy } from "@/utils/clipboard";
import { SuccessNotification } from "@/components/PopUp";
import { useTranslations } from "next-intl";
import { CardImageSize, CardImage } from "@/components/CardImage";
import { useLocalStorage } from "@/hooks/storage";
import { motion } from "framer-motion"
import { Backdrop } from "@/components/Backdrop";

export function DecklistDumpPageClient ({ params, csvPaste, duelistRecord, isAdmin }: { params: DecklistDumpPageParams, csvPaste: CsvPasteRowClient[], duelistRecord: DuelistRecord[], isAdmin: boolean }) {
  const { locale, version, server, week } = params

  const g = useTranslations("General")
  const t = useTranslations("DecklistDumpPage")

  const localCardsData = useLocalCardsData(locale)
  
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  
  const [cardSize, setCardSize] = useLocalStorage<CardImageSize>("deckPreviewCardSize", "small")

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp()
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false)
  
  const transformedData = csvPaste.map(row => ({
    ...row,
    duelistHandle: duelistRecord.find(d => d[`uid_${server}`] === row.uid)?.handle_display,
    isRegistered: duelistRecord.some(d => d[`uid_${server}`] === row.uid),
    isValidDeckcode: isValidDeckcode(row.deckcode),
    decoded: decodeAndSortActionCards(row.deckcode) as Tuple<number, 33>
  })).filter(row => row.isValidDeckcode.result)

  const PreviewChildren = playerIndex !== null && <>
    <div className="absolute left-5 icon_hover_bg" onClick={() => setCardSize(cardSize === "small" ? "medium" : "small")}>
      {
        cardSize === "small"
        ? <MagnifyingGlassPlusIcon/>
        : <MagnifyingGlassMinusIcon/>
      }
    </div>
    <div className="absolute right-5 icon_hover_bg" onClick={() => setPlayerIndex(null)}>
      <XMarkIcon />
    </div>
    {(() => {
      const view = transformedData[playerIndex]
      return <>
        <div className="section_title font-semibold">
          {view.duelistHandle || view.teamName}
        </div>
        <div className="text-center flex flex-row gap-0.5 justify-center items-center">
          <div>{t("uid_colon")}{view.uid} </div>
          <div className="icon_hover">
            <ClipboardDocumentIcon
              onClick={() => handleCopy(view.uid, copiedPopUpTrigger)}
            />
          </div>
        </div>
        {isAdmin && <div className={`${view.isRegistered ? "green" : "red"} text-center`}>
          {view.isRegistered ? t("registered") : t("unregistered")}
        </div>}
        <div className="pt-3 text-2xl text-center">
          {view.decoded.slice(0, 3).map(c => getCardName(c, localCardsData)).join(" | ")}
        </div>
        <div className="pt-3 flex flex-row gap-1 justify-center">
          {view.decoded.slice(0, 3).map(c =>
            <CardImage
              key={c}
              cardType="characters"
              cardId={c}
              size={cardSize === "small" ? "medium" : "large"}
              localCardsData={localCardsData}
              resize={true}
            />
          )}
        </div>
        <div className="pt-3 flex flex-wrap gap-1 justify-center">
          {view.decoded.slice(3).map((c, i) =>
            <CardImage
              key={i}
              cardType="actions"
              cardId={c}
              size={cardSize}
              localCardsData={localCardsData}
              resize={true}
            />
          )}
        </div>
        {showDeckcode && <div className={"pt-1.5 text-center monospaced select-all break-all"}>
          {view.deckcode}
        </div>}
        <div className="pt-1.5 flex flex-wrap gap-1.5 justify-center mx-auto">
          <CustomButton
            buttonText={g("copy_deckcode")}
            onClick={() => handleCopy(view.deckcode, copiedPopUpTrigger)}
          />
          <CustomButton
            buttonText={showDeckcode ? g("hide_deckcode") : g("show_deckcode")}
            onClick={() => setShowDeckcode(!showDeckcode)}
          />
        </div>
      </>
    })()}
  </>

  return <>
    <div className="less_1080">
      <Backdrop
        isOpen={playerIndex !== null}
        triggerFn={() => setPlayerIndex(null)}
      />
    </div> 
    <div className={`pt-6 flex flex-row gap-5 transition-all duration-200 w-full`}>
      <SuccessNotification show={showNotification} text={g("copied")} />
      <div>
        <table>
          <tbody>
            {transformedData.map((row, index) =>
              <tr key={row.uid} className={`group items-center px-3 py-0.5 ${index === 0 ? "border-y" : "border-b"} text-xs`}>
                <td className="w-50 align-middle text-left">
                  <div className="text-lg md:text-xl font-semibold">{row.duelistHandle || row.teamName}</div>
                  <div className="text-sm md:text-base whitespace-nowrap flex flex-row gap-0.5 items-center">
                    <div>{t("uid_colon")}{row.uid}</div>
                    <div>
                      <ClipboardDocumentIcon
                        className="size-4 hover:text-[#AF7637] transition-all duration-200 cursor-pointer"
                        onClick={() => handleCopy(row.uid, copiedPopUpTrigger)}
                      />
                    </div>
                  </div>
                  {isAdmin && <div className={row.isRegistered ? "green" : "red"}>
                    {row.isRegistered ? t("registered") : t("unregistered")}
                  </div>}
                </td>
                <LineupShowcaseForTable
                  characters={[row.decoded[0], row.decoded[1], row.decoded[2]]}
                  border="normal"
                  disableLink={true}
                  locale={locale}
                  version={version}
                  localCardsData={localCardsData}
                  alwaysHideCardNames={false}
                />
                <td className="w-80">
                  <div className="flex flex-wrap justify-end gap-2">
                    <CustomButton
                      buttonText={g("copy_deckcode")}
                      textSize="xs"
                      onClick={() => handleCopy(row.deckcode, copiedPopUpTrigger)}
                    />
                    <CustomButton
                      buttonText={t("view_deck")}
                      textSize="xs"
                      onClick={() => setPlayerIndex(index)}
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {typeof playerIndex === "number" && <div className="dump_deck_preview_desktop">
        {PreviewChildren}
      </div>}
      <motion.div
        className={`dump_deck_preview_mobile transform ${playerIndex === null ? "translate-y-full" : "translate-y-0"}`}
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {PreviewChildren}
      </motion.div>
    </div>
  </>
}