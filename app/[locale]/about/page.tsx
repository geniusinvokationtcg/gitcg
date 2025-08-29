import { useTranslations } from "next-intl";

export default function AboutPage(){
  const t = useTranslations("About");

  return <div>
    <h1 className="p-8 bg-red-200 text-xl">{t('title')}</h1>
  </div>
}