import { redirect } from 'next/navigation';
import { gameVersion } from "@/utils/version";
import { use } from "react";


export default function MajorRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  redirect(`/${locale}/major/${gameVersion.major.find(m => !m.start || new Date(m.start) >= new Date())?.version ?? gameVersion.latest}`);
}