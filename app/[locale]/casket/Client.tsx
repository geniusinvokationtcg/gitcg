'use client'

import "./style.css"
import { DeckBuilderPageParams, DeckBuilderPageSearchParams } from "./page"
import { CardImage } from "@/components/CardImage"
import { lazy, ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { useLocalCardsData } from "@/hooks/useLocalCardsData"
import { Checkbox, CustomButton, IconButton } from "@/components/Button"
import { CardType, PopUpType } from "@/utils/types"
import { costIconUrls } from "@/utils/vars"
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { ActiveCharacterCard } from "./ActiveCharacterCard"
import { elementResonance, getElement, isArcaneLegend, isValidCard } from "@/utils/cards"
import { decode as decodeDeck, encode as encodeDeck } from "@/utils/decoder"
import { usePopUp } from "@/hooks/utilities"
import { handleCopy } from "@/utils/clipboard"
import { SuccessNotification } from "@/components/PopUp"
import { useTranslations } from "next-intl"
import { Eye } from "@/components/Icons"
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { DialogBox } from "@/components/DialogBox"
import { Backdrop } from "@/components/Backdrop"
import { useLocalStorage } from "@/hooks/storage"
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon, FilterRemoveIcon } from "@hugeicons/core-free-icons"
import { usePathname, useRouter } from "next/navigation"

const Tooltip = lazy(() =>
  import("@/components/Tooltip").then(module => ({
    default: module.Tooltip,
  }))
)

export function DeckBuilderPageClient ({
  params, searchParams
}: {
  params: DeckBuilderPageParams;
  searchParams: DeckBuilderPageSearchParams;
}) {
  const { locale } = params

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const pathname = usePathname();

  //NEXT-INTL
  const g = useTranslations("General");
  const term = useTranslations("CardsTerminology");
  const t = useTranslations("DeckBuilderPage");

  //CARDS DATA
  const localCardsData = useLocalCardsData(locale);
  const { characters, codes } = localCardsData;

  //POP UP
  const [_triggerPopUp, showPopUp, setShowPopUp] = usePopUp();
  const [popUpContent, setPopUpContent] = useState<ReactNode>();
  const [popUpType, setPopUpType] = useState<PopUpType>("success");
  const triggerPopUp = useCallback((content: ReactNode, type: PopUpType = "success") => {
    setPopUpContent(content);
    setPopUpType(type);
    _triggerPopUp();
  }, [])
  
  //DIALOG BOX
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  const importDeckRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const handleImportDeck = () => {
    if(isImporting) return;
    if(!importDeckRef.current || !importDeckRef.current.value) return;

    setIsImporting(true);

    const decoded = decodeDeck(importDeckRef.current.value, "id", true);
    if(decoded.error) {
      triggerPopUp(t("invalid_deckcode"), "error");
      setIsImporting(false);
      return;
    }

    writeImport(decoded.data as number[]);

    setIsOpenDialog(false);
    setIsImporting(false);
    triggerPopUp(t("import_successful"));
    
  }
  const writeImport = (decodedData: (number | undefined)[]) => {
    let characters = (decodedData.slice(0, 3) as (number | undefined)[]).map((id, i, arr) =>
      codes.find(c => c.id === id)?.type === "character" &&
      !arr.slice(0, i).includes(id) //check duplicate
      ? id : null);
    let actions = (decodedData.slice(0, 33) as number[]).filter(id => codes.find(c => c.id === id)?.type === "action");
    //slice starts from 0 instead of 3 in case of characters actual length < 3
    
    const groupedActions: Map<number, number> = new Map();
    actions.forEach(id => groupedActions.set(id, (groupedActions.get(id) ?? 0) + 1));
    const groupedActionsArr = Array.from(groupedActions.entries());
    actions = [];
    groupedActionsArr.forEach(([id, count]) => {
      const maxCount = isArcaneLegend(id) ? 1 : 2;
      for(let i=1; i <= (count > maxCount ? maxCount : count); i++){
        actions.push(id);
      }
    })
    actions.sort((a, b) => a-b);

    setActiveCharacterCards(activeCharacterCards.map((c, i) =>{
      return {...c, cardId: characters[i] ?? null}
    }));
    setActiveActionCards(actions);
  }
  const cancelImportDeck = () => {
    if(!isImporting) setIsOpenDialog(false);
  }
  
  const [characterSearchQuery, setCharacterSearchQuery] = useState("");
  const [actionSearchQuery, setActionSearchQuery] = useState("");

  const [isActiveCardsLocked, setIsActiveCardsLocked] = useLocalStorage("casketIsActiveCardsLocked", false);
  const [selectionCardType, setSelectionCardType] = useState<CardType>("characters");
  const [isSelectingCards, setIsSelectingCards] = useState(false);

  const [activeCharacterCards, setActiveCharacterCards] = useState<{ id: number, cardId: number | null }[]>([
    { id: 1, cardId: null },
    { id: 2, cardId: null },
    { id: 3, cardId: null }
  ]); //id is only for dnd-kit identifier

  const addCharacterCard = useCallback((id: number) => {
    const nullIndex = activeCharacterCards.findIndex(c => c.cardId === null);
    if(nullIndex < 0 || activeCharacterCards.some(c => c.cardId === id)) return;
    setActiveCharacterCards(activeCharacterCards.toSpliced(nullIndex, 1, {
      ...activeCharacterCards[nullIndex], cardId: id
    }));
  }, [activeCharacterCards])
  const removeCharacterCard = useCallback((id: number) => {
    const index = activeCharacterCards.findIndex(c => c.cardId === id);
    if(activeCharacterCards.length <= 0 || index < 0) return;
    setActiveCharacterCards(activeCharacterCards.toSpliced(index, 1, {
      ...activeCharacterCards[index], cardId: null
    }));
  }, [activeCharacterCards])
  const isCharacterIncluded = (id: number | null) => activeCharacterCards.some(c => c.cardId === id);

  
  const actions = useMemo(() => {
    return localCardsData.actions.map(c => ({
      ...c,
      isValid: isValidCard(c.id, activeCharacterCards.map(_c => _c.cardId)),
      total_cost_num: (() => {
        const cost_num1 = unwantedCostIcons.includes(c.cost_type1_icon) ? 0 : Number(c.cost_num1);
        const cost_num2 = unwantedCostIcons.includes(c.cost_type2_icon) ? 0 : Number(c.cost_num2);
        const cost = (isNaN(cost_num1) ? 0 : cost_num1) + (isNaN(cost_num2) ? 0 : cost_num2);
        return cost
      })()
    }))
  }, [localCardsData, unwantedCostIcons, activeCharacterCards])
  
  //FILTER
  const [isFiltering, setIsFiltering] = useState(false);

  const characterTraits = useMemo(() => ({
    element: elementResonance.map(res => res.element),
    weapon: ["sword", "catalyst", "claymore", "bow", "polearm", "other_weapons"],
    affiliation: ["mondstadt", "liyue", "inazuma", "sumeru", "fontaine", "natlan", "fatui", "eremite", "monster", "hilichurl", "consecrated_beast", "arkhe_pneuma", "arkhe_ousia", "none"],
    hp: (() => {
      const hitpoints: Set<string> = new Set();
      localCardsData.characters.forEach(c => hitpoints.add(c.hp));
      return Array.from(hitpoints.values()).sort((a, b) => Number(a)-Number(b));
    })(),
    skill_cost: (() => {
      const costs: Set<number> = new Set();
      localCardsData.characters.forEach(c => {
        c.role_skill_infos.forEach(skill => {
          if(skill.type.includes(term("skill_type.passive_skill"))) return;
          const cost = skill.skill_costs.reduce((a, r) => a + (unwantedCostTypes.includes(r.cost_type) ? 0 : Number(r.cost_num)), 0);
          costs.add(cost);
        })
      })
      return Array.from(costs.values()).sort((a, b) => a-b).map(cost => cost.toString());
    })()
  }), [localCardsData])

  const actionTraits = useMemo(() => ({
    type: ["equipment_card", "support_card", "event_card"],
    tag: ["talent", "weapon", "sword", "catalyst", "claymore", "bow", "polearm", "artifact", "technique", "location", "companion", "item", "arcane_legend", "elemental_resonance", "food", "combat_action", "none"],
    cost: (() => {
      const costs: Set<number> = new Set();
      actions.forEach(c => costs.add(c.total_cost_num));
      return Array.from(costs.values()).sort((a, b) => a-b).map(cost => cost.toString());
    })()
  }), [localCardsData])

  const [characterFilter, setCharacterFilter] = useState<CharacterFilter>(defaultCharacterFilter)
  const characterFilterAmount = useMemo(() =>
    Object.values(characterFilter.categories).reduce((a, arr) => a + arr.length, 0)
    + Object.values(characterFilter.config).reduce((a, key) => a + (key ? 1 : 0), 0)
    + (characterFilter.sort.by ? 1 : 0), [characterFilter]
  )

  const [actionFilter, setActionFilter] = useState<ActionFilter>(defaultActionFilter)
  const actionFilterAmount = useMemo(() =>
    Object.values(actionFilter.categories).reduce((a, arr) => a + arr.length, 0)
    + Object.values(actionFilter.config).reduce((a, key) => a + (key ? 1 : 0), 0)
    + (actionFilter.sort.by ? 1 : 0), [actionFilter]
  )

  const handleCharacterFilter = useCallback((category: keyof CharacterFilter["categories"], item: string) => {
    setCharacterFilter(prev => {
      const items = prev.categories[category];

      const newItems = items.includes(item)
        ? items.filter(i => i !== item) //remove
        : [...items, item] //add
      
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: newItems
        }
      }
    })
  }, [characterFilter])
  const handleCharacterConfig = useCallback((config_key: keyof CharacterFilter["config"]) => setCharacterFilter({
    ...characterFilter, config: {
      ...characterFilter.config, [config_key]: !characterFilter.config[config_key]
    }
  }), [characterFilter])
  const handleCharacterSort = useCallback((by: CharacterFilter["sort"]["by"], is_ascending: boolean, dont_remove_by?: boolean) => {
    let newBy: CharacterFilter["sort"]["by"] = by;
    if(characterFilter.sort.by === by && !dont_remove_by) newBy = null;
    setCharacterFilter({
      ...characterFilter, sort: { by: newBy, is_ascending }
    })
  }, [characterFilter])

  const handleActionFilter = useCallback((category: keyof ActionFilter["categories"], item: string) => {
    setActionFilter(prev => {
      const items = prev.categories[category];

      const newItems = items.includes(item)
        ? items.filter(i => i !== item) //remove
        : [...items, item] //add
      
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: newItems
        }
      }
    })
  }, [actionFilter])
  const handleActionConfig = useCallback((config_key: keyof ActionFilter["config"]) => setActionFilter({
    ...actionFilter, config: {
      ...actionFilter.config, [config_key]: !actionFilter.config[config_key]
    }
  }), [actionFilter])
  const handleActionSort = useCallback((by: ActionFilter["sort"]["by"], is_ascending: boolean, dont_remove_by?: boolean) => {
    let newBy: ActionFilter["sort"]["by"] = by;
    if(actionFilter.sort.by === by && !dont_remove_by) newBy = null;
    setActionFilter({
      ...actionFilter, sort: { by: newBy, is_ascending }
    })
  }, [actionFilter])

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => {
      const element = getElement(c.element_type);
      const categories = characterFilter.categories;

      return (c.name.toLowerCase().includes(characterSearchQuery.toLowerCase()))
        && (element && categories.element.length > 0 ? categories.element.includes(element) : true)
        && (categories.weapon.length > 0 ? categories.weapon.some(weap => term(weap) === c.weapon) : true)
        && (categories.affiliation.length > 0
          ? (
            categories.affiliation.some(affi => affi !== "none"
              ? c.belongs.includes(term(affi))
              : !c.belongs.some(belong => belong !== "")
            )
          ) : true
        )
        && (categories.hp.length > 0 ? categories.hp.includes(c.hp) : true)
        && (categories.skill_cost.length > 0
          ? (
            categories.skill_cost.some(cost => {
              for (let skill of c.role_skill_infos) {
                const _cost = skill.skill_costs.reduce((a, r) => a + (unwantedCostTypes.includes(r.cost_type) ? 0 : Number(r.cost_num)), 0);
                if(_cost === Number(cost)) return true;
              }
              return false;
            })
          ) : true
        )
        && (characterFilter.config.teatime_mode
          ? (
            (() => {
              const cardsDetail = activeCharacterCards.map(activeCard =>
                localCardsData.characters.find(char => char.id === activeCard.cardId)
              ).filter(char => char !== undefined);

              if(cardsDetail.length !== 2) return true;

              const elements = cardsDetail.map(activeCard => activeCard.element_type);
              const weapons = cardsDetail.map(activeCard => activeCard.weapon);
              const belongs = cardsDetail.flatMap(activeCard => activeCard.belongs).filter(belong => belong !== "");

              const elementCount: Map<number, number> = new Map(); elements.forEach(element => elementCount.set(element, (elementCount.get(element) ?? 0) + 1 ));
              const weaponCount: Map<string, number> = new Map(); weapons.forEach(weap => weaponCount.set(weap, (weaponCount.get(weap) ?? 0) + 1 ));
              const belongCount: Map<string, number> = new Map(); belongs.forEach(belong => belongCount.set(belong, (belongCount.get(belong) ?? 0) + 1 ));

              const elementArr = Array.from(elementCount.entries()).sort(([, a], [, b]) => b-a); console.log(elementArr)
              const weaponArr = Array.from(weaponCount.entries()).sort(([, a], [, b]) => b-a);
              const belongArr = Array.from(belongCount.entries()).sort(([, a], [, b]) => b-a);

              return (elementArr[0][1] >=2 ? true : elementArr.some(([element]) => c.element_type === element))
                && (weaponArr[0][1] >=2 ? true : weaponArr.some(([weap]) => c.weapon === weap))
                && (belongArr[0][1] >=2 ? true : belongArr.some(([belong]) => c.belongs.includes(belong)))
            })()
          ) : true
        )
    }).sort((a, b) => {
      let comparation = 0;
      switch(characterFilter.sort.by) {
        case "name": comparation = a.name.localeCompare(b.name, locale); break;
        case "hp": comparation = Number(a.hp)-Number(b.hp); break;
      }
      return comparation * (characterFilter.sort.is_ascending ? 1 : -1)
    })
    
  }, [localCardsData, activeCharacterCards, characterFilter, characterSearchQuery])

  const filteredActions = useMemo(() => {
    return actions.filter(c => {
      const categories = actionFilter.categories;

      return (c.name.toLowerCase().includes(actionSearchQuery.toLowerCase()))
        && (actionFilter.config.show_invalid || c.isValid)
        && (categories.type.length > 0 ? categories.type.some(_type => term(_type) === c.action_type) : true)
        && (categories.tag.length > 0
          ? (
            categories.tag.some(_tag => _tag !== "none"
              ? c.action_card_tags.includes(term(_tag))
              : !c.action_card_tags.some(card_tag => card_tag !== "")
            )
          ) : true
        )
        && (categories.cost.length > 0 ? categories.cost.some(_cost => Number(_cost) === c.total_cost_num) : true)
    }).sort((a, b) => {
      let comparation = 0;
      switch(actionFilter.sort.by) {
        case "name": comparation = a.name.localeCompare(b.name, locale); break;
        case "cost": comparation = a.total_cost_num - b.total_cost_num; break;
      }
      return comparation * (actionFilter.sort.is_ascending ? 1 : -1);
    })
  }, [localCardsData, actions, actionFilter, actionSearchQuery]);

  const [activeActionCards, setActiveActionCards] = useState<number[]>([]);
  const groupedActionCards = useMemo(() => {
    return (() => {
      const _grouped: Map<number, number> = new Map();
      activeActionCards.forEach(id => _grouped.set(id, (_grouped.get(id) ?? 0) + 1));
      return Array.from(_grouped.entries());
    })()
  }, [activeActionCards]);
  const addActionCards = useCallback((id: number) => {
    const index = groupedActionCards.findIndex(([_id, count]) => _id === id);
    const count = index >= 0 ? groupedActionCards[index][1] : 0;
    if(isArcaneLegend(id) && count >= 1) return;
    if(count >= 2 || activeActionCards.length >= 30) return;
    setActiveActionCards([...activeActionCards, id].sort((a, b) => a-b));
  }, [groupedActionCards, activeActionCards])
  const removeActionCards = useCallback((id: number, eraseAll: boolean = false) => {
    if(eraseAll){
      setActiveActionCards(activeActionCards.filter(_id => _id !== id));
      return;
    }
    const index = activeActionCards.indexOf(id);
    if(index < 0) return;
    setActiveActionCards(activeActionCards.toSpliced(index, 1));
  }, [activeActionCards])
  const isActionSlotFull = useMemo(() => activeActionCards.length >= 30, [activeActionCards.length]);
  const isActionMaxed = useCallback((id: number) => {
    const card = groupedActionCards.find(([_id, index]) => _id === id);
    if(!card) return false;
    const [_id, count] = card;
    return (isArcaneLegend(id) && count >= 1) || (isActionSlotFull && count >= 1) || count >= 2;
  }, [groupedActionCards, isActionSlotFull])

  const [deckOffset, setDeckOffset] = useState(0);
  const exportDeck = useCallback((nextOffset: boolean = false) => {
    if(nextOffset) setDeckOffset( (deckOffset + 1) % 255 );
    const ids = [...activeCharacterCards.map(c => c.cardId ?? 0), ...activeActionCards];
    for(let i = ids.length; i < 33; i++){
      ids.push(0);
    }
    const deck = ids.map(id => codes.find(c => c.id === id)?.code ?? 0);
    const code = encodeDeck(deck, deckOffset);
    handleCopy(code, () => {
      triggerPopUp(<p className="text-center">{t("copied_to_clipboard")}<br/>{t("next_deck_offset_tip")}</p>);
    });
  }, [deckOffset, activeCharacterCards, activeActionCards, codes])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const {active, over} = event;
    if(!over || active.id === over.id) return;
    setActiveCharacterCards(() => {
      const originalPos = activeCharacterCards.findIndex(c => c.id === active.id);
      const newPos = activeCharacterCards.findIndex(c => c.id === over.id);
      return arrayMove(activeCharacterCards, originalPos, newPos);
    })
  }, [activeCharacterCards])
  
  const sensors = useSensors(
    useSensor(PointerSensor, activationConstraint), useSensor(TouchSensor, activationConstraint)
  )
  const dnd_id = useId();

  useEffect(() => {
    if(!searchParams.q) return;
    const decoded = decodeDeck(searchParams.q.replaceAll(" ", "+"), "id", true);
    if(decoded.error) return;
    writeImport(decoded.data as number[]);
    router.replace(pathname);
  }, [codes])

  const LeftContainer = <div className="left_container_children prevent_select">
    <div className="flex gap-2">
      <input
        type="search"
        placeholder={t("search_query_placeholder")}
        className={selectionCardType === "characters" ? "" : "hidden"}
        value={characterSearchQuery}
        onChange={e => setCharacterSearchQuery(e.target.value)}
      />
      <input
        type="search"
        placeholder={t("search_query_placeholder")}
        className={selectionCardType === "actions" ? "" : "hidden"}
        value={actionSearchQuery}
        onChange={e => setActionSearchQuery(e.target.value)}
      />
      <div className="relative">
        <CustomButton
          type="icon"
          buttonText={
            isFiltering ? <HugeiconsIcon icon={FilterRemoveIcon} color="currentColor" strokeWidth={1.5} size={16}/> : <HugeiconsIcon icon={FilterIcon} color="currentColor" strokeWidth={1.5} size={16}/>
          }
          isActive={isFiltering}
          onClick={() => setIsFiltering(!isFiltering)}
        />
        {((selectionCardType === "characters" && characterFilterAmount>0) || (selectionCardType === "actions" && actionFilterAmount>0)) &&
          <div className="pointer-events-none absolute text-[0.725rem] rounded-[50%] bg-white border-gray-500 border size-5 -top-2 -right-2 flex justify-center items-center">
            {selectionCardType === "characters" ? characterFilterAmount : actionFilterAmount}
          </div>
        }
      </div>
    </div>
    
    <div className="flex flex-row gap-4 justify-evenly w-full">
      <div onClick={() => setSelectionCardType("characters")} className={`clickable_text ${selectionCardType === "characters" ? "font-bold highlight" : ""}`}>{term("character_cards")}</div>
      <div onClick={() => setSelectionCardType("actions")} className={`clickable_text ${selectionCardType === "actions" ? "font-bold highlight" : ""}`}>{term("action_cards")}</div>
    </div>

    <div className={`card_selection_container ${selectionCardType === "characters" && !isFiltering ? "flex" : "hidden"}`}>
      <div>{filteredCharacters.map(c =>
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
    
    <div className={`card_selection_container ${selectionCardType === "actions" && !isFiltering ? "flex" : "hidden"}`}>
      <div>{filteredActions.map(c =>
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
          {!c.isValid && <div className="ribbon">{t("invalid_card")}</div>}
          <div className={`preview_button group ${true ? "disabled" : ""}`}>
            <Eye className="size-3 text-gray-700 group-hover:text-[#AF7637] duration-200 transition-colors" />
          </div>
          {(() => {
            const action = groupedActionCards.find(([id, count]) => id === c.id);
            return action && <div className="ribbon brown_ribbon">{`${action[1]} / ${c.is_special ? 1 : 2}`}</div>
          })()}
        </div>
      )}</div>
    </div>
    
    <div className={`relative filter_container ${selectionCardType === "characters" && isFiltering ? "" : "hidden"}`}>
      <Checkbox className="text-sm" trueCondition={characterFilter.config.teatime_mode} onClick={() => handleCharacterConfig("teatime_mode")}>
        <div className="flex flex-row gap-1 items-center">
          <p>{t("teatime_mode")}</p>
          <Tooltip position="bottom" content={<div className="text-xs w-50">{t("teatime_mode_explanation")}</div>}>
            <QuestionMarkCircleIcon className="size-4.5 translate-y-0.25"/>
          </Tooltip>
        </div>
      </Checkbox>
      
      <div>
        <div className="filter_category">{term("category.element")}</div>
        <div className="grid grid-cols-3">
          {characterTraits.element.map(elem => {
            return <Checkbox
              key={elem}
              className="text-sm"
              trueCondition = {characterFilter.categories.element.includes(elem)}
              onClick = {() => handleCharacterFilter("element", elem)}
            >
              {term(elem)}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.weapon")}</div>
        <div className="grid grid-cols-2">
          {characterTraits.weapon.map(weap => {
            return <Checkbox
              key={weap}
              className="text-sm"
              trueCondition = {characterFilter.categories.weapon.includes(weap)}
              onClick = {() => handleCharacterFilter("weapon", weap)}
            >
              {term(weap)}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.affiliation")}</div>
        <div className="grid grid-cols-2">
          {characterTraits.affiliation.map(affi => {
            return <Checkbox
              key={affi}
              className="text-sm"
              trueCondition = {characterFilter.categories.affiliation.includes(affi)}
              onClick = {() => handleCharacterFilter("affiliation", affi)}
            >
              {term(affi)}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.hp")}</div>
        <div className="grid grid-cols-4">
          {characterTraits.hp.map(_hp => {
            return <Checkbox
              key={_hp}
              className="text-sm"
              trueCondition = {characterFilter.categories.hp.includes(_hp)}
              onClick = {() => handleCharacterFilter("hp", _hp)}
            >
              {_hp}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.skill_cost")}</div>
        <div className="grid grid-cols-4">
          {characterTraits.skill_cost.map(cost => {
            return <Checkbox
              key={cost}
              className="text-sm"
              trueCondition = {characterFilter.categories.skill_cost.includes(cost)}
              onClick = {() => handleCharacterFilter("skill_cost", cost)}
            >
              {cost}
            </Checkbox>
          })}
        </div>
      </div>

      <div>
        <div className="filter_category">{g("sort")}</div>
        <div className="grid grid-cols-1">
          {characterSortable.map(by => {
            return <Checkbox
              key={by}
              className="text-sm"
              trueCondition = {characterFilter.sort.by === by}
              onClick = {() => handleCharacterSort(by, characterFilter.sort.is_ascending)}
            >
              {term(`category.${by}`)}
            </Checkbox>
          })}
          
        </div>
        <div className="separator_line"></div>
        <div className="grid grid-cols-2">
          <Checkbox
            className="text-sm"
            trueCondition = {characterFilter.sort.is_ascending}
            onClick= {() => handleCharacterSort(characterFilter.sort.by, true, true)}
            disabled={characterFilter.sort.by === null}
          >{g("ascending")}</Checkbox>
          <Checkbox
            className="text-sm"
            trueCondition = {!characterFilter.sort.is_ascending}
            onClick= {() => handleCharacterSort(characterFilter.sort.by, false, true)}
            disabled={characterFilter.sort.by === null}
          >{g("descending")}</Checkbox>
        </div>
      </div>

      <div className="flex flex-row gap-1 justify-center items-center my-2">
        <CustomButton
          buttonText={g("reset")}
          textSize="xs"
          onClick={() => setCharacterFilter(defaultCharacterFilter)}
        />
      </div>

    </div>

    <div className={`filter_container ${selectionCardType === "actions" && isFiltering ? "" : "hidden"}`}>
      <Checkbox className="text-sm" trueCondition={actionFilter.config.show_invalid} onClick={() => handleActionConfig("show_invalid")}>{t("show_invalid_cards")}</Checkbox>

      <div>
        <div className="filter_category">{term("category.type")}</div>
        <div className="grid grid-cols-2">
          {actionTraits.type.map(_type => {
            return <Checkbox
              key={_type}
              className="text-sm"
              trueCondition = {actionFilter.categories.type.includes(_type)}
              onClick = {() => handleActionFilter("type", _type)}
            >
              {term(_type)}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.tag")}</div>
        <div className="grid grid-cols-2">
          {actionTraits.tag.map(_tag => {
            return <Checkbox
              key={_tag}
              className="text-sm"
              trueCondition = {actionFilter.categories.tag.includes(_tag)}
              onClick = {() => handleActionFilter("tag", _tag)}
            >
              {term(_tag)}
            </Checkbox>
          })}
        </div>
      </div>
      <div>
        <div className="filter_category">{term("category.cost")}</div>
        <div className="grid grid-cols-4">
          {actionTraits.cost.map(_cost => {
            return <Checkbox
              key={_cost}
              className="text-sm"
              trueCondition = {actionFilter.categories.cost.includes(_cost)}
              onClick = {() => handleActionFilter("cost", _cost)}
            >
              {_cost}
            </Checkbox>
          })}
        </div>
      </div>

      <div>
        <div className="filter_category">{g("sort")}</div>
        <div className="grid grid-cols-1">
          {actionSortable.map(by => {
            return <Checkbox
              key={by}
              className="text-sm"
              trueCondition = {actionFilter.sort.by === by}
              onClick = {() => handleActionSort(by, actionFilter.sort.is_ascending)}
            >
              {term(`category.${by}`)}
            </Checkbox>
          })}
          
        </div>
        <div className="separator_line"></div>
        <div className="grid grid-cols-2">
          <Checkbox
            className="text-sm"
            trueCondition = {actionFilter.sort.is_ascending}
            onClick= {() => handleActionSort(actionFilter.sort.by, true, true)}
            disabled={actionFilter.sort.by === null}
          >{g("ascending")}</Checkbox>
          <Checkbox
            className="text-sm"
            trueCondition = {!actionFilter.sort.is_ascending}
            onClick= {() => handleActionSort(actionFilter.sort.by, false, true)}
            disabled={actionFilter.sort.by === null}
          >{g("descending")}</Checkbox>
        </div>
      </div>

      <div className="flex flex-row gap-1 justify-center items-center my-2">
        <CustomButton
          buttonText={g("reset")}
          textSize="xs"
          onClick={() => setActionFilter(defaultActionFilter)}
        />
      </div>
      
    </div>

  </div>

  return <div className="px-6 py-6 overflow-hidden">
    <SuccessNotification show={showPopUp} text={popUpContent} type={popUpType} />

    <Backdrop isOpen={isOpenDialog} triggerFn={cancelImportDeck}/>
    <DialogBox isOpen={isOpenDialog}>
      <div className="relative flex flex-col gap-4 bg-white rounded-2xl w-100 h-fit p-5 text-center">
        <IconButton className="absolute right-4" onClick={cancelImportDeck}><XMarkIcon/></IconButton>
        <div className="font-semibold">{isImporting ? t("importing") : t("import_deck")}</div>
        <input
          type="text"
          placeholder={t("enter_deckcode_placeholder")}
          ref={importDeckRef}
          onKeyUp={e => {
            switch(e.key) {
              case "Enter": handleImportDeck(); break;
              case "Escape": cancelImportDeck(); break;
            }
          }}
        />
        <div className="flex flex-row gap-2 justify-center">
          <CustomButton
            buttonText={g("cancel")}
            textSize="xs"
            disabled={isImporting}
            onClick={cancelImportDeck}
          />
          <CustomButton
            buttonText={g("import")}
            textSize="xs"
            disabled={isImporting}
            onClick={handleImportDeck}
          />
        </div>
      </div>
    </DialogBox>

    <div className="left_container_sidebar"><Backdrop isOpen={isSelectingCards} triggerFn={() => setIsSelectingCards(false)}/></div>
    <div className={`left_container_sidebar fixed top-0 left-0 h-full py-6 px-4 bg-white z-101 transform transition-transform duration-200 ease-in-out ${isSelectingCards ? "translate-x-0" : "-translate-x-full"}`}>
      <IconButton className="flex justify-end pb-4" onClick={() => setIsSelectingCards(false)}><XMarkIcon/></IconButton>
      {LeftContainer}
    </div>

    <div className="flex flex-wrap gap-5">
      <div className="left_container">{LeftContainer}</div>

      <div className="flex flex-col gap-3 items-center w-fit">
        
        <div className="flex flex-row gap-4 justify-between w-full">
          <div className="left_buttons">
            <CustomButton
              buttonText={t("open_cards_selection_sidebar")}
              textSize="xs"
              onClick={() => setIsSelectingCards(true)}
            />
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <CustomButton
              buttonText={mounted && isActiveCardsLocked ? t("unlock_active_cards"): t("lock_active_cards")}
              textSize="xs"
              onClick={() => {
                setIsActiveCardsLocked(!isActiveCardsLocked);
                triggerPopUp(isActiveCardsLocked ? t("active_cards_unlocked_successful") : t("active_cards_locked_successful"))
              }}
            />
            <CustomButton
              buttonText={g("import")}
              textSize="xs"
              onClick={() => {
                setIsOpenDialog(!isOpenDialog);
                setTimeout(() => importDeckRef.current?.focus(), 0);
              }}
            />
            <CustomButton
              buttonText={t("erase_active_cards")}
              textSize="xs"
              onClick={(e) => {
                if(e.detail === 1) triggerPopUp(t("erase_confirmation"), "info");
                if(e.detail === 3) {
                  setActiveCharacterCards(activeCharacterCards.map(c => ({ ...c, cardId: null })))
                  setActiveActionCards([]);
                  setShowPopUp(false);
                }
              }}
            />
            <CustomButton
              buttonText={g("export")}
              textSize="xs"
              onClick={(e) => exportDeck(e.detail === 2)}
            />
          </div>
        </div>
        

        <div className="font-semibold">{term("active_characters")}</div>
        <div className="border-1 border-gray-300 rounded-xl w-full flex justify-center prevent_select">
          <DndContext id={dnd_id} collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="active_character_container">
              <SortableContext items={activeCharacterCards} strategy={horizontalListSortingStrategy}>
                {activeCharacterCards.map(c =>
                  <div key={c.id} onClick={() => c.cardId && !isActiveCardsLocked && removeCharacterCard(c.cardId)}>
                    <ActiveCharacterCard
                      localCardsData={localCardsData}
                      id={c.id}
                      cardId={c.cardId}
                      isLocked={isActiveCardsLocked}
                    />
                  </div>
                )}
              </SortableContext>
            </div>
          </DndContext>
        </div>

        <div className="font-semibold">{term("active_actions")}</div>
        <div className="active_action_container prevent_select">
          <div>
            {activeActionCards.map((id, i) => {
              const c = actions.find(_c => _c.id === id);
              if(!c) return;
              return <div key={i}>
                <div
                  className="action_card_image"
                  onClick={() => !isActiveCardsLocked && removeActionCards(id)}
                >
                  <div className={isActiveCardsLocked ? "disabled" : ""}>
                    <CardImage
                      cardType="actions"
                      cardId={c.id}
                      size={70}
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
                  {!c.isValid && <div className="ribbon">{t("invalid_card")}</div>}
                </div>
              </div>
            })}
          </div>
        </div>
      </div>

    </div>
  
  </div>
}

const unwantedCostTypes = ["1", "19"]; //for characters
const unwantedCostIcons = [ //for actions
  "https://webstatic.hoyoverse.com/upload/static-resource/2023/01/17/36cb5de8667e09ae102d165b89d6e441_604510126303725408.png",
  "https://fastcdn.hoyoverse.com/static-resource-v2/2023/07/10/95ea5f8357e489bccf5fb40a73955d2f_3489949153267385660.png"
];

const characterSortable = ["name", "hp"];
const actionSortable = ["name", "cost"];

const defaultCharacterFilter = {
  categories: {
    element: [],
    weapon: [],
    affiliation: [],
    hp: [],
    skill_cost: []
  },
  config: {
    teatime_mode: false
  },
  sort: {
    by: null,
    is_ascending: true
  }
}
const defaultActionFilter = {
  categories: {
    type: [],
    tag: [],
    cost: [],
  },
  config: {
    show_invalid: false
  },
  sort: {
    by: null,
    is_ascending: true
  }
}

const activationConstraint = {
  activationConstraint: {
    distance: 10
  }
}

interface CharacterFilter {
  categories: {
    element: string[]
    weapon: string[]
    affiliation: string[]
    hp: string[]
    skill_cost: string[]
  }
  config: {
    teatime_mode: boolean
  }
  sort: {
    by: null | string
    is_ascending: boolean
  }
}
interface ActionFilter {
  categories: {
    type: string[]
    tag: string[]
    cost: string[]
  },
  config: {
    show_invalid: boolean
  }
  sort: {
    by: null | string
    is_ascending: boolean
  }
}