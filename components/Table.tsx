import Link from "next/link";
import { getCardName } from '@/utils/cards';
import { BorderType, CardsDataType } from "@/utils/types";
import { ReactNode } from "react";
import { useTranslations } from 'next-intl';
import { CardImageSmall } from "./CardImage";

export function LineupShowcaseForTable ({
  characters, border, disableLink, locale, version, localCardsData, childrenOnly = false, alwaysHideCardNames = false
}: {
  characters: [number, number, number];
  border: BorderType | [BorderType, BorderType, BorderType];
  disableLink?: boolean;
  locale: string;
  version: string;
  localCardsData: CardsDataType;
  childrenOnly?: boolean
  alwaysHideCardNames?: boolean
}) {
  if(typeof border === "string") border = [border, border, border];
  const charactersName = characters.map(c => getCardName(c, localCardsData));

  const children = <div className={"flex items-center justify-center gap-0.5 " + (disableLink ? "" : "cursor-pointer")}>
    <span className={`hidden ${alwaysHideCardNames ? "" : "md:block"} w-[220px]`}>
      {charactersName[0]}<br />{charactersName[1]}<br />{charactersName[2]}
    </span>
    {characters.map((c, index) =>
      <CardImageSmall
        key={c}
        cardType="characters"
        cardId={c}
        localCardsData={localCardsData}
      />
    )}
  </div>

  if(childrenOnly) return children;

  return <td className="custom sticky left-0 bg-white group-hover:bg-gray-50 transition-background duration-200 z-10 w-fit md:w-[380px] p-0.5">
    {
      disableLink
      ? children
      : <Link href={`/${locale}/weekly/${version}/showcase/${characters[0]}-${characters[1]}-${characters[2]}`} className="block">{children}</Link>
    }
  </td>
}

export function NoDataAvailable ({ className }: {className?: string}) {
  const t = useTranslations();
  return <div className={`${className} flex flex-col justify-center items-center gap-1 p-3`}>
    <img src="/stickers/lesson_time.webp" alt="An emoji of Collei reading something." className="size-24" />
    <span className="text-sm text-center text-gray-500">
      {t("General.no_data")}
    </span>
  </div>
}

export function ColumnHeaderWithSorter<T>({
  className, text, columnKey, isSorting, sortAsc, sortHandlerFn, isAscendingFirst = false, colSpan = 1, rowSpan = 1
}: {
  className?: string;
  text?: string | ReactNode;
  columnKey: string;
  isSorting: boolean;
  sortAsc: boolean;
  sortHandlerFn: (key: keyof T, isAscendingFirst?: boolean) => void;
  isAscendingFirst?: boolean
  colSpan?: number
  rowSpan?: number
}) {
  return ( 
    <th
      className={`cursor-pointer hover:bg-gray-300 transition-background duration-200 ${className}`}
      onClick={() => sortHandlerFn(columnKey as keyof T, isAscendingFirst)}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      <span className={"flex items-center"}>
        <span className="w-full">{text}</span>
        <span className="w-2 flex flex-col items-center justify-center text-[8px] select-none">
          <span style={{ lineHeight: "0.8" }}>{isSorting ? (sortAsc ? "▲" : "‎") : "▲"}</span>
          <span style={{ lineHeight: "0.8" }}>{isSorting ? (sortAsc ? "‎" : "▼") : "▼"}</span>
        </span>
      </span>
    </th>
  )
}