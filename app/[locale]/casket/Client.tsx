'use client'

import "./style.css"
import { DeckBuilderPageParams } from "./page"
import { CardImage } from "@/components/CardImage"
import { useMemo, useState } from "react"
import { useLocalCardsData } from "@/hooks/useLocalCardsData"
import { CustomButton } from "@/components/Button"
import { CardType } from "@/utils/types"
import { costIconUrls } from "@/utils/vars"
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { ActiveCharacterCard } from "./ActiveCharacterCard"
import { isArcaneLegend, isValidCard } from "@/utils/cards"
import { encode as encodeDeck } from "@/utils/decoder"
import { useCopiedPopUp } from "@/hooks/utilities"
import { handleCopy } from "@/utils/clipboard"
import { SuccessNotification } from "@/components/PopUp"
import { useTranslations } from "next-intl"

export function DeckBuilderPageClient ({
  params
}: {
  params: DeckBuilderPageParams;
}) {
  const { locale } = params

  const g = useTranslations("General");

  const localCardsData = useLocalCardsData(locale);
  const { characters, codes } = localCardsData;

  const { showNotification, copiedPopUpTrigger } = useCopiedPopUp();
  const [ showclearAllNotification, setShowClearAllNotification ] = useState(false);

  const [selectionCardType, setSelectionCardType] = useState<CardType>("characters");
  
  //FILTER
  const [showInvalidCards, setShowInvalidCards] = useState(true);

  const [activeCharacterCards, setActiveCharacterCards] = useState<{ id: number, cardId: number | null }[]>([
    { id: 1, cardId: null },
    { id: 2, cardId: null },
    { id: 3, cardId: null }
  ]); //id is only for dnd-kit identifier

  const addCharacterCard = (id: number) => {
    const nullIndex = activeCharacterCards.findIndex(c => c.cardId === null);
    if(nullIndex < 0 || activeCharacterCards.some(c => c.cardId === id)) return;
    setActiveCharacterCards(activeCharacterCards.toSpliced(nullIndex, 1, {
      ...activeCharacterCards[nullIndex], cardId: id
    }));
  }
  const removeCharacterCard = (id: number) => {
    const index = activeCharacterCards.findIndex(c => c.cardId === id);
    if(activeCharacterCards.length <= 0 || index < 0) return;
    setActiveCharacterCards(activeCharacterCards.toSpliced(index, 1, {
      ...activeCharacterCards[index], cardId: null
    }));
  }
  const isCharacterIncluded = (id: number | null) => activeCharacterCards.some(c => c.cardId === id);

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if(!over || active.id === over.id) return;
    setActiveCharacterCards((c) => {
      const originalPos = activeCharacterCards.findIndex(c => c.id === active.id);
      const newPos = activeCharacterCards.findIndex(c => c.id === over.id);
      return arrayMove(activeCharacterCards, originalPos, newPos);
    })
  }
  
  const activationConstraint = {
    activationConstraint: {
      distance: 10
    }
  }
  const sensors = useSensors(
    useSensor(PointerSensor, activationConstraint), useSensor(TouchSensor, activationConstraint)
  )

  const _actions = useMemo(() => {
    return localCardsData.actions.map(c => ({
      ...c,
      isValid: isValidCard(c.id, activeCharacterCards.map(_c => _c.cardId))
    }))
  }, [localCardsData, activeCharacterCards])
  
  let actions = _actions;
  if(showInvalidCards) actions = actions.filter(c => c.isValid);

  const [activeActionCards, setActiveActionCards] = useState<number[]>([]);
  const groupActionCards = () => {
    const _grouped: Map<number, number> = new Map();
    activeActionCards.forEach(id => _grouped.set(id, (_grouped.get(id) ?? 0) + 1));
    return Array.from(_grouped.entries());
  }
  const groupedActionCards = groupActionCards();
  const addActionCards = (id: number) => {
    const index = groupedActionCards.findIndex(([_id, count]) => _id === id);
    const count = index >= 0 ? groupedActionCards[index][1] : 0;
    if(isArcaneLegend(id) && count >= 1) return;
    if(count >= 2 || activeActionCards.length >= 30) return;
    setActiveActionCards([...activeActionCards, id].sort((a, b) => a-b));
  }
  const removeActionCards = (id: number, eraseAll: boolean = false) => {
    if(eraseAll){
      setActiveActionCards(activeActionCards.filter(_id => _id !== id));
      return;
    }
    const index = activeActionCards.indexOf(id);
    if(index < 0) return;
    setActiveActionCards(activeActionCards.toSpliced(index, 1));
  }
  const isActionSlotFull = activeActionCards.length >= 30;
  const isActionMaxed = (id: number) => {
    const card = groupedActionCards.find(([_id, index]) => _id === id);
    if(!card) return false;
    const [_id, count] = card;
    return (isArcaneLegend(id) && count >= 1) || (isActionSlotFull && count >= 1) || count >= 2;
  }

  const exportDeck = () => {
    const ids = [...activeCharacterCards.map(c => c.cardId ?? 0), ...activeActionCards];
    for(let i = ids.length; i < 33; i++){
      ids.push(0);
    }
    const deck = ids.map(id => codes.find(c => c.id === id)?.code ?? 0);
    const code = encodeDeck(deck, 0);
    handleCopy(code, copiedPopUpTrigger)
  }

  return <div className="mx-6 my-6 overflow-hidden">
    <SuccessNotification show={showNotification} text={"Copied to clipboard"} />
    <div className="mb-4 flex flex-row gap-2 justify-between">
      <div className="flex flex-row gap-2">
        <CustomButton
          buttonText="Filter"
          textSize="xs"
        />
      </div>
      <div className="flex flex-row gap-2">
        <SuccessNotification show={showclearAllNotification} text={"Triple click the button to clear all"} />
        <div onClick={(event) => {
          if(event.detail === 1) {
            setShowClearAllNotification(true);
            setTimeout(() => setShowClearAllNotification(false), 5000);
          }
          if(event.detail === 3) {
            setActiveCharacterCards(activeCharacterCards.map(c => ({ ...c, cardId: null })))
            setActiveActionCards([]);
            setShowClearAllNotification(false);
          }
        }}>
          <CustomButton
            buttonText="Clear All"
            textSize="xs"
          />
        </div>
        <CustomButton
          buttonText="Export"
          textSize="xs"
          onClick={exportDeck}
        />
      </div>
    </div>

    <div className="flex flex-wrap gap-5">
      <div className="flex flex-col gap-3 prevent_select">
        <div className="flex flex-row gap-4 justify-evenly">
          <div onClick={() => setSelectionCardType("characters")} className={`clickable_text ${selectionCardType === "characters" ? "font-bold highlight" : ""}`}>Character Cards</div>
          <div onClick={() => setSelectionCardType("actions")} className={`clickable_text ${selectionCardType === "actions" ? "font-bold highlight" : ""}`}>Action Cards</div>
        </div>

        <div className={`card_selection_container ${selectionCardType === "characters" ? "flex" : "hidden"}`}>
          <div>{characters.map(c =>
            <div key={c.id} className={`character_card_image ${isCharacterIncluded(c.id) ? "darkened" : ""} ${!isCharacterIncluded(null) && !isCharacterIncluded(c.id) ? "whitened" : ""}`}>
              <div
                className={!isCharacterIncluded(null) && !isCharacterIncluded(c.id) ? "disabled" : ""}
                onClick={() => isCharacterIncluded(c.id) ? removeCharacterCard(c.id) : addCharacterCard(c.id)}
              >
                <CardImage
                  cardType="characters"
                  cardId={c.id}
                  size="medium"
                  borderType="normal"
                  resize={false}
                  localCardsData={localCardsData}
                />
              </div>
              <div>{c.hp}</div>
              <img src="/game_icons/hp.png" />
            </div>
          )}</div>
        </div>
        
        <div className={`card_selection_container ${selectionCardType === "actions" ? "flex" : "hidden"}`}>
          <div>{actions.map(c =>
            <div key={c.id} className={`action_card_image ${isActionMaxed(c.id) ? "darkened" : ""} ${!isActionMaxed(c.id) && isActionSlotFull ? "whitened" : ""}`}>
              <div 
                className={!isActionMaxed(c.id) && isActionSlotFull ? "disabled" : ""}
                onClick={() => isActionMaxed(c.id) ? removeActionCards(c.id, true) : addActionCards(c.id)}>
                <CardImage
                  cardType="actions"
                  cardId={c.id}
                  size="medium"
                  borderType="normal"
                  resize={false}
                  localCardsData={localCardsData}
                />
              </div>
              <div>{c.cost_num1}</div>
              <img src={c.cost_type1_icon || costIconUrls.aligned} />
              {c.cost_type2_icon && <>
                <div className={c.is_special ? "hidden" : ""}>{c.cost_num2}</div>
                <img src={c.cost_type2_icon} />
              </>}
              {!c.isValid && <div className="ribbon">Invalid</div>}
            </div>
          )}</div>
        </div>
        <div className="filter_container">
          <div className="w-full" onClick={() => setShowInvalidCards(!showInvalidCards) } >Show invalid cards</div>
        </div>

      </div>

      <div className="flex flex-col gap-3 items-center">
        <div className="font-semibold">Active Lineup</div>
        <div className="border-1 border-gray-300 rounded-xl w-226 flex justify-center prevent_select">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="grid grid-cols-3 gap-16 p-4">
              <SortableContext items={activeCharacterCards} strategy={horizontalListSortingStrategy}>
                {activeCharacterCards.map(c =>
                  <div key={c.id} onClick={() => c.cardId && removeCharacterCard(c.cardId)}>
                    <ActiveCharacterCard
                      localCardsData={localCardsData}
                      id={c.id}
                      cardId={c.cardId}
                    />
                  </div>
                )}
              </SortableContext>
            </div>
          </DndContext>
        </div>

        <div className="font-semibold">Active Deck</div>
        <div className="border-1 border-gray-300 rounded-xl w-226 h-116 flex justify-center prevent_select">
          <div className="grid grid-cols-10 gap-2 h-fit p-4">
            {activeActionCards.map((id, i) => {
              const c = actions.find(_c => _c.id === id);
              if(!c) return;
              return <div key={i}>
                <div className="action_card_image" onClick={() => removeActionCards(id)}>
                  <div>
                    <CardImage
                      cardType="actions"
                      cardId={c.id}
                      size="medium"
                      borderType="normal"
                      resize={true}
                      localCardsData={localCardsData}
                    />
                  </div>
                  <div>{c.cost_num1}</div>
                  <img src={c.cost_type1_icon || costIconUrls.aligned} />
                  {c.cost_type2_icon && <>
                    <div className={c.is_special ? "hidden" : ""}>{c.cost_num2}</div>
                    <img src={c.cost_type2_icon} />
                  </>}
                  {!c.isValid && <div className="ribbon">Invalid</div>}
                </div>
              </div>
            })}
          </div>
        </div>
      </div>

    </div>
  
  </div>
}