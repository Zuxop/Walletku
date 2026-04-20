import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip auth check if env vars are not set (development fallback)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables - skipping auth check');
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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

    const { pathname } = request.nextUrl;

    // Protect dashboard routes
    const protectedRoutes = ['/', '/transaksi', '/dompet', '/budget', '/tujuan', '/hutang-piutang', '/laporan', '/kategori', '/pengaturan'];
    const isProtected = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect logged in users away from auth pages
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

    if (isAuthPage && user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Middleware auth error:', error);
    // Allow request to proceed on auth error (fail open)
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
