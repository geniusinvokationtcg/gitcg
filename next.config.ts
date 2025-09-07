import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false
  // i18n: {
  //   locales: ['en', 'id'], // Supported languages
  //   defaultLocale: 'en',   // Default language
  // }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);