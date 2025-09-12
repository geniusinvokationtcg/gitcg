import { redirect } from 'next/navigation';
import gameVersion from "@/game-version.json";
import { use } from "react";


export default function WeeklyRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  redirect(`/${locale}/weekly/${gameVersion.available.at(-1)}`);
}