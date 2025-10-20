"use client"

import { CsvPasteRow, DuelistRecord, Tuple } from "@/utils/types";
import { DecklistDumpPageParams } from "./page";
import { useState } from "react";
import { decodeAndSortActionCards, isValidDeckcode } from "@/utils/decoder";
import { getCardName } from "@/utils/cards";
import { LineupShowcaseForTable } from "@/components/Table";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { CustomButton } from "@/components/Button";
import { ClipboardDocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCopiedPopUp } from "@/hooks/utilities";
import { handleCopy } from "@/utils/clipboard";
import { SuccessNotification } from "@/components/PopUp";
import { useTranslations } from "next-intl";
import { CardImageLarge, CardImageMedium, CardImageSmall } from "@/components/CardImage";

export function DecklistDumpPageClient ({ params, csvPaste, duelistRecord }: { params: DecklistDumpPageParams, csvPaste: CsvPasteRow[], duelistRecord: DuelistRecord[] }) {
  const { locale, version, server, week } = params

  const g = useTranslations("General")

  const localCardsData = useLocalCardsData(locale)
  
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp()
  const [showDeckcode, setShowDeckcode] = useState<boolean>(false)
  
  const transformedData = csvPaste.map(row => ({
    ...row,
    duelistHandle: duelistRecord.find(d => d[`uid_${server}`] === row.uid)?.handle_display,
    isValidDeckcode: isValidDeckcode(row.deckcode),
    decoded: decodeAndSortActionCards(row.deckcode) as Tuple<number, 33>
  })).filter(row => row.checkedInAt && row.isValidDeckcode.result)

  return <div className="pt-6 flex flex-row gap-5 transition-all duration-200 w-full">
    <SuccessNotification show={showNotification} text={g("copied")} />
    <div>
      <table>
        <tbody>
          {transformedData.map((row, index) =>
            <tr key={row.userID} className={`group items-center px-3 py-0.5 ${index === 0 ? "border-y" : "border-b"} text-sm`}>
              <td className="w-50 align-middle text-left">
                <div className="text-lg md:text-xl font-semibold">{row.duelistHandle || row.teamName}</div>
                <div className="text-sm md:text-base whitespace-nowrap flex flex-row gap-0.5 items-center">
                  <div>UID: {row.uid}</div>
                  <div>
                    <ClipboardDocumentIcon
                      className="size-4 hover:text-[#AF7637] transition-all duration-200 cursor-pointer"
                      onClick={() => handleCopy(row.uid, copiedPopUpTrigger)}
                    />
                  </div>
                </div>
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
                    buttonText="Copy deckcode"
                    textSize="xs"
                    onClick={() => handleCopy(row.deckcode, copiedPopUpTrigger)}
                  />
                  <CustomButton
                    buttonText="Player details"
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
    {typeof playerIndex === "number" && <div className="hidden md:block w-full max-w-150 p-5 border-1 border-gray-300 rounded-xl overflow-y-auto max-h-[calc(100vh-170px)] sticky top-10 self-start">
      <div className="absolute right-5 icon_hover_bg">
        <XMarkIcon onClick={() => setPlayerIndex(null)}/>
      </div>
      {(() => {
        const view = transformedData[playerIndex]
        return <>
          <div className="section_title font-semibold">
            {view.duelistHandle || view.teamName}
          </div>
          <div className="text-center flex flex-row gap-0.5 justify-center items-center">
            <div>UID: {view.uid} </div>
            <div className="icon_hover">
              <ClipboardDocumentIcon
                onClick={() => handleCopy(view.uid, copiedPopUpTrigger)}
              />
            </div>
          </div>
          <div className="text-center"> In-game name: {view.inGameName}</div>
          <div className="pt-3 text-2xl text-center">
            {view.decoded.slice(0, 3).map(c => getCardName(c, localCardsData)).join(" | ")}
          </div>
          <div className="pt-3 flex flex-row gap-1 justify-center">
            {view.decoded.slice(0, 3).map(c =>
              <CardImageMedium
                key={c}
                cardType="characters"
                cardId={c}
                localCardsData={localCardsData}
                resize={true}
              />
            )}
          </div>
          <div className="pt-3 flex flex-wrap gap-1 justify-center">
            {view.decoded.slice(3).map((c, i) =>
              <CardImageSmall
                key={i}
                cardType="actions"
                cardId={c}
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
              buttonText="Copy deckcode"
              onClick={() => handleCopy(view.deckcode, copiedPopUpTrigger)}
            />
            <CustomButton
              buttonText={showDeckcode ? "Hide deckcode" : "Show deckcode"}
              onClick={() => setShowDeckcode(!showDeckcode)}
            />
          </div>
        </>
      })()}
    </div>}
  </div>
}