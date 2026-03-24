"use client"

import { isArcaneLegend } from "@/utils/cards"
import { CardsDataType, Locales } from "@/utils/types"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function useDeckImageCanvas(locale: Locales, localCardsData: CardsDataType) {
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

  const generateDeckImage = async (canvas: HTMLCanvasElement, canvasContainer: HTMLDivElement, characters: (number | null)[], actions: number[]) => {
    if(!canvas) return;

    canvas.width = 1200
    canvas.height = 1630

    canvasContainer.style.maxWidth = `${canvas.width/canvas.height*canvasContainer.clientHeight}px`

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

  const generateDeckImageGenshincards = async (canvas: HTMLCanvasElement, canvasContainer: HTMLDivElement, characters: (number | null)[], groupedActionCards: [number, number][]) => {
    if(!canvas) return;

    //DETERMINE CANVAS SIZE
    const charDiameter = 128
    const actionHeight = 75

    const width = 420
    const height = charDiameter + 5 + actionHeight*groupedActionCards.length + 4

    canvas.width = width
    canvas.height = height

    canvasContainer.style.maxWidth = `${width/height*canvasContainer.clientHeight}px`

    const context = canvas.getContext("2d")
    if(!context) return;

    try {
      setIsGenerating(true)

      context.clearRect(0, 0, width, height)

      //CHARACTERS (AVATAR)
      let char_x_offset = 9
      for (let i=0; i<3; i++) {
        const char_x_offset_current = char_x_offset
        char_x_offset += charDiameter+9 //in the beginning of the loop so if a char is null, the offset still moves

        const card_id = characters[i]
        if(!card_id) continue;

        const imgUrl = localCardsData.characters.find(c => c.id === card_id)?.avatar
        if(!imgUrl) continue;
        const img = await loadImage(imgUrl)
        context.drawImage(img, char_x_offset_current, 0, charDiameter, charDiameter)
      }

      //ACTIONS
      let action_y_offset = charDiameter+9

      for (let i=0; i<groupedActionCards.length; i++) {
        const [card_id, count] = groupedActionCards[i]
        if(!card_id || count === 0) continue;

        const isArcane = isArcaneLegend(card_id)

        const card_detail = localCardsData.actions.find(c => c.id === card_id)
        if(!card_detail) continue;
        
        //card image
        const imgUrl = card_detail.resource
        if(!imgUrl) continue;
        const img = await loadImage(imgUrl + "?x-oss-process=image/format,png/quality,Q_90/resize,s_340")

        context.save()
        context.roundRect(0, action_y_offset, 420, actionHeight, 14)
        context.clip()
        
        context.drawImage(img, 0, 150, 340, actionHeight, 80, action_y_offset, 340, actionHeight)

        //define gradient
        const gradient = context.createLinearGradient(0, action_y_offset, 420, action_y_offset+actionHeight)
        if(isArcane) {
          gradient.addColorStop(0, "rgba(128, 0, 128, 1)")
          gradient.addColorStop(0.2, "rgba(128, 0, 128, 1)")
          gradient.addColorStop(1, "rgba(128, 0, 128, 0.1)")
        }
        else {
          gradient.addColorStop(0, "rgba(0, 0, 0, 1)")
          gradient.addColorStop(0.2, "rgba(0, 0, 0, 1)")
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        }
        
        context.fillStyle = gradient
        context.fillRect(0, action_y_offset, 420, actionHeight)

        //card name
        context.fillStyle = "white"
        context.font = "normal 1.3rem Arial"
        context.textAlign = "left"
        context.textBaseline = "middle"
        
        const cardName = card_detail.name
        const maxTextWidth = 280
        const wordSeparator = ["zh-cn", "zh-tw", "ja", "ko"].includes(locale) ? "" : " "
        const words = cardName.split(wordSeparator)
        const lines: string[] = []
        let currentLine = words[0]
        for(let i=1; words.length>0 && i<words.length; i++) {
          const word = words[i]
          const testLine = currentLine + wordSeparator + word
          const textMetrics = context.measureText(testLine)
          
          if(textMetrics.width > maxTextWidth) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        if(currentLine.length > 0) lines.push(currentLine);

        lines.forEach((line, i) => {
          const yLineAdjustment = -(lines.length-1)*25/2 + i*25
          const y = action_y_offset + actionHeight/2 + yLineAdjustment
          context.fillText(line, 70, y, maxTextWidth)
        })

        //card count
        context.fillStyle = "white"
        context.font = "700 2.4rem Arial"
        context.textAlign = "left"
        context.textBaseline = "middle"
        context.fillText("×"+count, 365, action_y_offset+actionHeight/2)
        context.strokeText("×"+count, 365, action_y_offset+actionHeight/2)

        //card cost
        context.font = "700 1.6rem Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillStyle = costs.find(cost => cost.type === card_detail.cost_type1)?.color || "white"
        
        const costDistance = 12
        if(!card_detail.cost_type2 || card_detail.cost_type2 === "6") {
          context.fillText(card_detail.cost_num1, 35, action_y_offset+27)
        } else {
          context.fillText(card_detail.cost_num1, 35-costDistance, action_y_offset+27)
          context.fillStyle = costs.find(cost => cost.type === card_detail.cost_type2)?.color || "white"
          context.fillText(card_detail.cost_num2, 35+costDistance, action_y_offset+27)
        }
        if(!card_detail.cost_type2) {
          const costImg = await loadImage(costs.find(cost => cost.type === card_detail.cost_type1)?.icon || fallbackCostIcon)
          context.drawImage(costImg, 35-22/2, action_y_offset+40, 22, 22)
        } else {
          const costImgUrl1 = costs.find(cost => cost.type === card_detail.cost_type1)?.icon || fallbackCostIcon
          const costImg1 = await loadImage(costImgUrl1)
          context.drawImage(costImg1, 35-22/2-costDistance, action_y_offset+40, 22, 22)

          const costImgUrl2 = costs.find(cost => cost.type === card_detail.cost_type2)?.icon || fallbackCostIcon
          const costImg2 = await loadImage(costImgUrl2)
          context.drawImage(costImg2, 35-22/2+costDistance, action_y_offset+40, 22, 22)
        }

        //restore rounded corner clip
        context.restore()

        action_y_offset += actionHeight
      }

    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  return { generateDeckImage, generateDeckImageGenshincards, copyDeckImage, downloadDeckImage, isGenerating }
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

const costs = [
  { type: "1", color: "rgba(242, 194, 104, 1)", icon: "/game_icons/code/1.png" },
  { type: "3", color: "white", icon: "/game_icons/code/3.png" },
  { type: "6", color: "white", icon: "/game_icons/code/6.png" },
  { type: "10", color: "rgba(151, 152, 153, 1)", icon: "/game_icons/code/10.png" },
  { type: "11", color: "rgba(122, 241, 241, 1)", icon: "/game_icons/code/11_element.png" },
  { type: "12", color: "rgba(0, 192, 255, 1)", icon: "/game_icons/code/12_element.png" },
  { type: "13", color: "rgba(255, 102, 64, 1)", icon: "/game_icons/code/13_element.png" },
  { type: "14", color: "rgba(204, 128, 255, 1)", icon: "/game_icons/code/14_element.png" },
  { type: "15", color: "rgba(255, 176, 13, 1)", icon: "/game_icons/code/15_element.png" },
  { type: "16", color: "rgba(155, 229, 61, 1)", icon: "/game_icons/code/16_element.png" },
  { type: "17", color: "rgba(51, 215, 160, 1)", icon: "/game_icons/code/17_element.png" },
]
const fallbackCostIcon = "/game_icons/code/3.png"