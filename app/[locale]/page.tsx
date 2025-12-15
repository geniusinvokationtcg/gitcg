import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HomePageClient from "./Client";

export async function generateMetadata (): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = {
    title: t("HomePage.title"),
    description: t("HomePage.description")
  }
  return {...metadata, openGraph: metadata, twitter: metadata}
}

export default function HomePage() {
  return <HomePageClient/>;
}