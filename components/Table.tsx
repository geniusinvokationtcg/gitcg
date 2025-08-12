import Link from "next/link";
import { getCardImageUrl, getCardName, localizeCardName } from '@/utils/cards';
import { BorderType } from "@/utils/types";
import { ReactNode } from "react";
import { useTranslations } from 'next-intl';

export function LineupShowcaseForTable ({
  characters, border, disableLink, locale, version
}: {
  characters: [number, number, number];
  border: BorderType | [BorderType, BorderType, BorderType];
  disableLink?: boolean;
  locale: string;
  version: string;
}) {
  if(typeof border === "string") border = [border, border, border];
  const charactersName = characters.map(c => getCardName(c, "characters", locale));

  const children = <div className={"flex items-center justify-center gap-0.5 " + (disableLink ? "" : "cursor-pointer")}>
    <span className="hidden md:block w-[220px]">
      {charactersName[0]}<br />{charactersName[1]}<br />{charactersName[2]}
    </span>
    {
      characters.map((c, index) =>
        <span className="relative w-[40px] h-[68.6px] md:w-[50px] md:h-[85.8px]" key={c}>
          <img src={getCardImageUrl("characters", c, "id")} className="absolute inset-0 w-[97%] pl-[0.4px] pt-[1.5px] object-contain z-0" title={charactersName[index]}></img>
          <img src={`/borders/${border[index]}.png`} className="relative inset-0 w-full z-10 pointer-events-none"></img>
        </span>
      )
    }
  </div>

  return <td className="custom sticky left-0 bg-white group-hover:bg-gray-50 transition-background duration-200 z-10 w-[380px] p-0.5">
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
  className, text, columnKey, isSorting, sortAsc, sortHandlerFn
}: {
  className?: string;
  text?: string | ReactNode;
  columnKey: string;
  isSorting: boolean;
  sortAsc: boolean;
  sortHandlerFn: (key: keyof T) => void;
}) {
  return <th className={`cursor-pointer ${className}`} onClick={() => sortHandlerFn(columnKey as keyof T)}>
    <span className={"flex items-center"}>
      <span className="w-full">{text}</span>
      <span className="w-2 flex flex-col items-center justify-center text-[8px] select-none">
        <span style={{ lineHeight: "0.8" }}>{isSorting ? (sortAsc ? "▲" : "‎") : "▲"}</span>
        <span style={{ lineHeight: "0.8" }}>{isSorting ? (sortAsc ? "‎" : "▼") : "▼"}</span>
      </span>
    </span>
  </th>
}