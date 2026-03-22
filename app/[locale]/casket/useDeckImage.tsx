"use client"

import { isArcaneLegend } from "@/utils/cards"
import { CardsDataType, Locales } from "@/utils/types"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function useDeckImageCanvas(localCardsData: CardsDataType) {
  const term = useTranslations("CardsTerminology")

  const [isGenerating, setIsGenerating] = useState(false)

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = src
      
      img.onload = () => resolve(img)
      img.onerror = reject
    })
  }

  const downloadDeckImage = (canvas: HTMLCanvasElement | null, deckcode: string) => {
    if(!canvas) return;

    canvas.toBlob((blob) => {
      if(!blob) return;

      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.download = `GITCG-deck-${deckcode}.png`
      link.href = url
      link.click()

      URL.revokeObjectURL(url)
    }, "image/png")
  }

  const copyDeckImage = async (canvas: HTMLCanvasElement | null, triggerFn?: () => any, unsupportedTriggerFn?: () => any) => {
    if(!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      )

      if (!blob) return

      if(!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem) {
        if(unsupportedTriggerFn) unsupportedTriggerFn();
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ])

      if(triggerFn) triggerFn();
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const generateDeckImage = async (canvas: HTMLCanvasElement, characters: (number | null)[], actions: number[], locale: Locales) => {
    if(!canvas) return;

    const context = canvas.getContext("2d")
    if(!context) return;

    const drawText = (text: string, x: number, y: number) => {
      context.fillStyle = "#84603D"
      context.font = "normal 1.8rem HYWenHei"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fontKerning = "none"
      context.fillText(text, x, y)
    }
    
    try {
      setIsGenerating(true)

      context.clearRect(0, 0, 1200, 1630)

      const baseImg = await loadImage("/assets/deck_canvas.png")
      context.drawImage(baseImg, 0, 0, 1200, 1630)

      drawText(term("active_characters"), 174+821/2, 120+53/2)
      drawText(term("active_actions"), 174+821/2, 120+53+287.4+53/2)

      //LOGO
      const logoLocale = ["zh-cn", "zh-tw", "ja", "ko"].includes(locale) ? locale : "en"
      const logoImg = await loadImage(`/assets/logo/genshin_logo_${logoLocale}.webp`)
      const logoPos = position.logo[logoLocale as "en" | "zh-cn" | "zh-tw" | "ja" | "ko"]
      context.drawImage(logoImg, logoPos.left, logoPos.top, logoPos.width, logoPos.height)
      
      //CARD BORDERS
      const borderImg = await loadImage("/borders/normal.png")
      const esotericBorderImg = await loadImage("/borders/normal_esoteric.png")

      //CHARACTERS
      for(let i=0; i<3; i++) {
        const imgUrl = localCardsData.characters.find(c => c.id === characters[i])?.resource || "/game_icons/Origin_Card_Back.webp" + "?x-oss-process=image/format,png/quality,Q_90/resize,s_180"
        const img = await loadImage(imgUrl)
        const imgPos = position.characters[i]
        context.drawImage(img, imgPos.left, imgPos.top, imgPos.width, imgPos.height)

        context.drawImage(borderImg, imgPos.left-1, imgPos.top-1, 140, 239.42)
      }

      //ACTIONS
      for(let i=0; i<30; i++) {
        const imgUrl = (localCardsData.actions.find(c => c.id === actions[i])?.resource || "/game_icons/Origin_Card_Back.webp") + "?x-oss-process=image/format,png/quality,Q_90/resize,s_140"
        const img = await loadImage(imgUrl)
        const imgPos = position.actions[i]
        context.drawImage(img, imgPos.left, imgPos.top, imgPos.width, imgPos.height)

        context.drawImage(isArcaneLegend(actions[i]) ? esotericBorderImg : borderImg, imgPos.left-0.5, imgPos.top-0.5, 91, 155.71)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }   
  }

  return { generateDeckImage, copyDeckImage, downloadDeckImage, isGenerating }
}

const position = {
	characters: [
		{ left: 353, top: 178, width: 138, height: 236 },
		{ left: 515, top: 178, width: 138, height: 236 },
		{ left: 677, top: 178, width: 138, height: 236 },
	],
	characters_aoc: [
		{ left: 592, top: 231, width: 90, height: 154 },
		{ left: 706, top: 231, width: 90, height: 154 },
		{ left: 820, top: 231, width: 90, height: 154 },
	],
	actions: [
		{ left: 254, top: 522, width: 90, height: 154 },
		{ left: 368, top: 522, width: 90, height: 154 },
		{ left: 482, top: 522, width: 90, height: 154 },
		{ left: 596, top: 522, width: 90, height: 154 },
		{ left: 710, top: 522, width: 90, height: 154 },
		{ left: 824, top: 522, width: 90, height: 154 },
		{ left: 254, top: 700, width: 90, height: 154 },
		{ left: 368, top: 700, width: 90, height: 154 },
		{ left: 482, top: 700, width: 90, height: 154 },
		{ left: 596, top: 700, width: 90, height: 154 },
		{ left: 710, top: 700, width: 90, height: 154 },
		{ left: 824, top: 700, width: 90, height: 154 },
		{ left: 254, top: 878, width: 90, height: 154 },
		{ left: 368, top: 878, width: 90, height: 154 },
		{ left: 482, top: 878, width: 90, height: 154 },
		{ left: 596, top: 878, width: 90, height: 154 },
		{ left: 710, top: 878, width: 90, height: 154 },
		{ left: 824, top: 878, width: 90, height: 154 },
		{ left: 254, top: 1056, width: 90, height: 154 },
		{ left: 368, top: 1056, width: 90, height: 154 },
		{ left: 482, top: 1056, width: 90, height: 154 },
		{ left: 596, top: 1056, width: 90, height: 154 },
		{ left: 710, top: 1056, width: 90, height: 154 },
		{ left: 824, top: 1056, width: 90, height: 154 },
		{ left: 254, top: 1234, width: 90, height: 154 },
		{ left: 368, top: 1234, width: 90, height: 154 },
		{ left: 482, top: 1234, width: 90, height: 154 },
		{ left: 596, top: 1234, width: 90, height: 154 },
		{ left: 710, top: 1234, width: 90, height: 154 },
		{ left: 824, top: 1234, width: 90, height: 154 },
	],
  logo: {
    "en": { left: 804, top: 1450, width: 278, height: 106.2 },
    "zh-cn": { left: 821, top: 1413, width: 240, height: 190 },
    "zh-tw": { left: 821, top: 1413, width: 240, height: 190 },
    "ja": { left: 834, top: 1425, width: 216, height: 167.8 },
    "ko": { left: 852, top: 1426, width: 175, height: 159.6 },
  }
};