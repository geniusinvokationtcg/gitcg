'use client'

import { useEffect, useState } from "react"
import defaultCardsData from "@/cards.json"
import { CardsDataType } from "@/utils/types"

export function useLocalCardsData (locale?: string) {
  // switch(locale){
  //   case "id": locale = "en"
  // }
  
  const [cardsData, setCardsData] = useState<CardsDataType>({
    characters: [],
    actions: [],
    codes: []
  })

  useEffect(() => {
    if(!locale || locale === "en") {
      setCardsData(defaultCardsData)
      return
    }

    const getCardsData = async () => {
      try{
        const imported = await import(`@/cards/cards_${locale}.json`)
        setCardsData(imported)
      }
      catch (e) {
        setCardsData(defaultCardsData)
      }
    }

    getCardsData()
  }, [locale])

  return cardsData
}