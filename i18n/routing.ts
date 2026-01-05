import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'id', "vi", 'zh-cn'],
  defaultLocale: 'en'
});