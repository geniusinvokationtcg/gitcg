import { Locales } from "@/utils/types";
import MajorRecapClient from "./Client";
import { notFound } from "next/navigation";
import { gameVersion } from "@/utils/version";

export type MajorRecapParams = {
  locale: Locales;
  version: string
}

export default async function MajorRecap ({ params }: { params: Promise<MajorRecapParams> }) {
  const p = await params;

  const { version } = p;

  const majorMetadata = gameVersion.major.find(i => i.version === version);
  
  if(!majorMetadata) notFound();
  if(majorMetadata.start && new Date(majorMetadata.start) < new Date()) notFound();

  return <MajorRecapClient params={p}/>
}