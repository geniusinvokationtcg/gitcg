import { CardImage } from "@/components/CardImage";
import { useLocalCardsData } from "@/hooks/useLocalCardsData";
import { percentize } from "@/utils/formatting";
import { CsvPasteRowClient } from "@/utils/types";

interface CsvPasteRowClientTransformed extends CsvPasteRowClient {
  isValidDeckcode: { result: boolean, reason: string }
  decoded: number[]
}

export default function CharacterCardMostUsed ({ csvPaste }: { csvPaste: CsvPasteRowClientTransformed[] }) {
  const cardsMap: Map<number, number> = new Map();
  
  csvPaste.forEach(row => {
    for (let i = 0; i < 3; i++) {
      const id = row.decoded[i];
      cardsMap.set(id, (cardsMap.get(id) ?? 0) + 1);
    }
  })

  const cards = Array.from(cardsMap.entries());
  cards.sort(([, a], [, b]) => b-a);

  const localCardsData = useLocalCardsData();

  return <div className="genshin_font text-center flex flex-col gap-2 justify-center items-center">
    <p className="text-[3rem]">Most used characters</p>
    <div className="flex flex-row gap-6">
      {cards.slice(0, 2).map(([id, count]) =>
        <div key={id} className="flex flex-col gap-2 justify-center items-center">
          <CardImage
            cardType="characters"
            cardId={id}
            size={150}
            borderType="lustrous"
          />
          <div
            style={{
              boxShadow: "1px 1px 0 black"
            }}
            className="bg-[#fad38c] px-4 h-10 w-56 max-w-56 rounded-r-3xl rounded-b-3xl flex items-center justify-center"
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.25rem]">{localCardsData.codes.find(c => c.id === id)?.name || ""}</p>
          </div>
          <p className="text-[1.5rem]">{`${count}/${csvPaste.length} (${percentize(count/csvPaste.length, "en")})`}</p>
        </div>
      )}
    </div>

    <div className="flex flex-row gap-4">
      {cards.slice(2, 5).map(([id, count]) =>
        <div key={id} className="flex flex-col gap-2 justify-center items-center">
          <CardImage
            cardType="characters"
            cardId={id}
            size={120}
            borderType="lustrous"
          />
          <div
            style={{
              boxShadow: "1px 1px 0 black"
            }}
            className="bg-[#fad38c] px-4 h-8 w-44 max-w-44 rounded-r-3xl rounded-b-3xl flex items-center justify-center"
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.15rem]">{localCardsData.codes.find(c => c.id === id)?.name || ""}</p>
          </div>
          <p className="text-[1.25rem]">{`${count}/${csvPaste.length} (${percentize(count/csvPaste.length, "en")})`}</p>
        </div>
      )}
    </div>
  </div>
}