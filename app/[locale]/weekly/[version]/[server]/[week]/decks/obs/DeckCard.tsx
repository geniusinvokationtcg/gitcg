import { CardImage } from "@/components/CardImage";

export function DeckLeftPaneCard ({playerName, deck, omit}: { playerName: string; deck: number[]; omit?: boolean }) {
  const actions = deck.slice(3, 33);
  
  return <div style={{ width: 548, height: 470 }} className={`flex flex-col gap-2 mt-3.5 items-center ${omit ? "opacity-0" : "opacity-100"}`}>
    <div className="genshin_font text-[32px] text-center whitespace-nowrap text-ellipsis">
      {playerName}
    </div>

    <div className="grid grid-cols-8 gap-[5px] justify-center mt-0.5">
      {actions.map((c, i) =>
        <CardImage
          key={i}
          cardType="actions"
          cardId={c}
          size={53}
          borderType="lustrous"
        />
      )}
    </div>
  </div>
}