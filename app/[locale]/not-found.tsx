import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound () {
  const t = useTranslations();
  return <div className="flex flex-col justify-center items-center gap-1 p-3">
    <img src="/stickers/no_response.webp" alt="An emoji of Collei not giving response." className="size-24" />
    <span className="text-sm text-center text-gray-500">
      {t.rich("General.not_found", {
        br: () => <br/>,
        home: (t) => <Link href="/" className="inline">{t}</Link>
      })}
    </span>
  </div>
}