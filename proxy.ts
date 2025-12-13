import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
 
const intlMiddleware = createMiddleware(routing);
 
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  
  const intlResult = intlMiddleware(request as any);

  const response = intlResult instanceof Response ? intlResult : NextResponse.next();

  response.headers.set("x-pathname", url.pathname);
  response.headers.set("x-search", url.search);
  
  return response;
}