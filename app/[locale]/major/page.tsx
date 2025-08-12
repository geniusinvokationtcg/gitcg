import { redirect } from 'next/navigation';
import gameVersion from "@/game-version.json";
import { use } from "react";


export default function MajorRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  redirect(`/${locale}/major/${gameVersion.major[0].version}`);
}