import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import deepmerge from "deepmerge";
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';
import "./globals.css";

export const metadata = {
  title: "GITCG Community & Tournaments",
  description: "GITCG community tournaments database",
  openGraph: {
    title: "GITCG Community & Tournaments",
    description: "GITCG community tournaments database"
  },
  twitter: {
    title: "GITCG Community & Tournaments",
    description: "GITCG community tournaments database"
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const userMessages = (await import(`../../messages/${locale}.json`)).default;
  const defaultMessages = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
  const messages = deepmerge<Record<string, any>>(defaultMessages, userMessages);
  
  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navbar locale={locale}/>
          <main className="flex justify-center flex-grow">
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}