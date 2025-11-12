'use client'

import "./style.css"
import { DeckBuilderPageParams } from "./page"
import { CardImage } from "@/components/CardImage"
import { ReactNode, useMemo, useState } from "react"
import { useLocalCardsData } from "@/hooks/useLocalCardsData"
import { Checkbox, CustomButton } from "@/components/Button"
import { CardType, Elements } from "@/utils/types"
import { costIconUrls } from "@/utils/vars"
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { ActiveCharacterCard } from "./ActiveCharacterCard"
import { elementResonance, isArcaneLegend, isValidCard } from "@/utils/cards"
import { encode as encodeDeck } from "@/utils/decoder"
import { usePopUp } from "@/hooks/utilities"
import { handleCopy } from "@/utils/clipboard"
import { SuccessNotification } from "@/components/PopUp"
import { useTranslations } from "next-intl"
import { Eye } from "@/components/Icons"

export function DeckBuilderPageClient ({
  params
}: {
  params: DeckBuilderPageParams;
}) {
  const { locale } = params

  //NEXT-INTL
  const g = useTranslations("General");
  const term = useTranslations("CardsTerminology");

  //CARDS DATA
  const localCardsData = useLocalCardsData(locale);
  const { characters, codes } = localCardsData;

  //POP UP
  const [_triggerPopUp, showPopUp, setShowPopUp] = usePopUp();
  const [popUpContent, setPopUpContent] = useState<ReactNode>();
  const triggerPopUp = (content: ReactNode) => {
    setPopUpContent(content);
    _triggerPopUp();
  }
  
  //FILTER
  const [showInvalidCards, setShowInvalidCards] = useState(true);
  const characterTraits = {
      element: elementResonance.map(res => res.element),
      weapon: ["sword", "catalyst", "claymore", "bow", "polearm", "other_weapons"],
      affiliation: ["mondstadt", "liyue", "inazuma", "sumeru", "fontaine", "natlan", "fatui", "eremite", "monster", "hilichurl", "consecrated_beast", "arkhe_pneuma", "arkhe_ousia", "none"]
    }
  const actionTraits = [
    {
      category: "type",
      items: ["equipment_card", "support_card", "event_card"]
    },
    {
      category: "tag",
      items: ["talent", "weapon", "artifact", "technique", "location", "companion", "item", "arcane_legend", "elemental_resonance", "food", "combat_action", "none"]
    }
  ]
  const [characterFilter, setCharacterFilter] = useState<CharacterFilter>({
    categories: {
      element: [],
      weapon: [],
      affiliation: [],
      hp: [],
    },
    config: {
      has_big_skill: false,
      teatime_mode: false
    }
  })
  const [actionFilter, setActionFilter] = useState<ActionFilter>({
    categories: {
      type: [],
      tag: [],
      cost: [],
    },
    config: {
      include_energy_cost: true,
      show_invalid: false
    }
  })
  const handleCharacterFilter = (category: keyof CharacterFilter["categories"], item: string) => {
    let temp = characterFilter.categories;
    const items = temp[category];
    const index = items.indexOf(item);

    if(index < 0) {
      items.push(item);
    } else {
      items.splice(index, 1);
    }
    temp[category] = items;

    setCharacterFilter({
      ...characterFilter, categories: temp
    })
  }

  const [selectionCardType, setSelectionCardType] = useState<CardType>("characters");

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

  const [deckOffset, setDeckOffset] = useState(0);
  const exportDeck = (nextOffset: boolean = false) => {
    if(nextOffset) setDeckOffset( (deckOffset + 1) % 255 );
    const ids = [...activeCharacterCards.map(c => c.cardId ?? 0), ...activeActionCards];
    for(let i = ids.length; i < 33; i++){
      ids.push(0);
    }
    const deck = ids.map(id => codes.find(c => c.id === id)?.code ?? 0);
    const code = encodeDeck(deck, deckOffset);
    handleCopy(code, () => {
      triggerPopUp(<p>Copied to clipboard<br/>Double click the Export button if the code doesn't work</p>);
    });
  }

  return <div className="mx-6 my-6 overflow-hidden">
    <SuccessNotification show={showPopUp} text={popUpContent} />
    <div className="mb-4 flex flex-row gap-2 justify-between">
      <div className="flex flex-row gap-2">
        <CustomButton
          buttonText="Filter"
          textSize="xs"
        />
      </div>
      <div className="flex flex-row gap-2">
        <CustomButton
          buttonText="Clear All"
          textSize="xs"
          onClick={(e) => {
            if(e.detail === 1) triggerPopUp("Triple click the button to clear all");
            if(e.detail === 3) {
              setActiveCharacterCards(activeCharacterCards.map(c => ({ ...c, cardId: null })))
              setActiveActionCards([]);
              setShowPopUp(false);
            }
          }}
        />
        <CustomButton
          buttonText="Export"
          textSize="xs"
          onClick={(e) => exportDeck(e.detail === 2)}
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
              <div className={`preview_button group ${false ? "disabled" : ""}`}>
                <Eye className="size-3 text-gray-700 group-hover:text-[#AF7637] duration-200 transition-colors" />
              </div>
              {(() => {
                const action = groupedActionCards.find(([id, count]) => id === c.id);
                return action && <div className="ribbon brown_ribbon">{`${action[1]} / ${c.is_special ? 1 : 2}`}</div>
              })()}
            </div>
          )}</div>
        </div>
        <div className="filter_container text-sm">
          <Checkbox className="text-sm" trueCondition={!showInvalidCards} onClick={() => setShowInvalidCards(!showInvalidCards)}>Show invalid cards</Checkbox>
          <div>
            <div>{term("category.element")}</div>
            {characterTraits.element.map(elem => {
              return <div>
                <Checkbox
                  trueCondition = {characterFilter.categories.element.includes(elem)}
                  onClick = {() => handleCharacterFilter("element", elem)}
                >
                  {term(elem)}
                </Checkbox>
              </div>
            })}
          </div>
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

interface CharacterFilter {
  categories: {
    element: string[]
    weapon: string[]
    affiliation: string[]
    hp: string[]
  }
  config: {
    has_big_skill: boolean
    teatime_mode: boolean
  }
}
interface ActionFilter {
  categories: {
    type: string[]
    tag: string[]
    cost: string[]
  },
  config: {
    include_energy_cost: boolean
    show_invalid: boolean
  }
}