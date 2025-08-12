import { NextIntlClientProvider, hasLocale } from 'next-intl';
import deepmerge from "deepmerge";
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';
import "./globals.css";
 
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
      <body className="antialiased flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navbar locale={locale}/>
          <main className="flex justify-center flex-grow">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}