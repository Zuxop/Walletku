import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/transaksi') ||
      request.nextUrl.pathname.startsWith('/dompet') ||
      request.nextUrl.pathname.startsWith('/budget') ||
      request.nextUrl.pathname.startsWith('/tujuan') ||
      request.nextUrl.pathname.startsWith('/hutang') ||
      request.nextUrl.pathname.startsWith('/laporan') ||
      request.nextUrl.pathname.startsWith('/kategori') ||
      request.nextUrl.pathname.startsWith('/pengaturan') ||
      request.nextUrl.pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect logged in users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/login') ||
       request.nextUrl.pathname.startsWith('/register')) &&
      user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
};
