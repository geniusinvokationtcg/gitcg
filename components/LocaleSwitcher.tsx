import { CustomSelect } from "./Dropdown"
import { routing } from "../i18n/routing"
import { usePathname, useRouter } from '../i18n/navigation'
import { Locales } from "../utils/types"
import { languages } from "@/utils/vars"
import { useSearchParams } from "next/navigation"

export function LocaleSwitcher({ currentLocale }: {currentLocale: Locales}) {
  const pathname = usePathname();//.replace(new RegExp(`^/(${routing.locales.join('|')})`),"");
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const fullPath = query ? `${pathname}?${query}` : pathname;

  const router = useRouter();
  return (
    <CustomSelect
      options={routing.locales.map(l => (
        { value: l, label: languages.find(row => row.locale === l)?.name || l }
      ))}
      value={currentLocale.toUpperCase()}
      onChange={(newLocale: Locales) => router.replace(fullPath, {locale: newLocale})}
      className="text-sm border rounded-sm
        hover:text-[#AF7637] hover:border-[#AF7637] focus:border-[#AF7637] focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md"
      listClassName="text-sm text-gray-700 hover:bg-gray-100 hover:text-[#AF7637]"
    />
  )
}