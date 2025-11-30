import { Locales } from "@/utils/types";
import MajorRecapClient from "./Client";
import { notFound } from "next/navigation";
import { gameVersion, getVerLabel } from "@/utils/version";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export type MajorRecapParams = {
  locale: Locales;
  version: string
}

export async function generateMetadata({ params }: { params: Promise<MajorRecapParams> }) {
  const { locale, version } = await params;

  const t = await getTranslations("MajorRecap")

  const metadata: Metadata = {
    title: t("title", { version: getVerLabel(version, locale) })
  }
  
  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default async function MajorRecap ({ params }: { params: Promise<MajorRecapParams> }) {
  const p = await params;

  const { version } = p;

  const majorMetadata = gameVersion.major.find(i => i.version === version);
  
  if(!majorMetadata) notFound();
  if(majorMetadata.start && new Date(majorMetadata.start*1000) > new Date()) notFound();

  return <MajorRecapClient params={p}/>
}