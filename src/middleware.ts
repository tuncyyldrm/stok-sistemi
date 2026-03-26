import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Response objesini oluşturuyoruz. 
  // 'request' headers'ını geçmek, çerezlerin taşınması için kritiktir.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Supabase istemcisini oluşturuyoruz
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Çerezi hem request'e hem de response'a set ediyoruz
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Oturumu (session) sunucu tarafında doğruluyoruz
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Erişim Kontrolleri
  
  // Eğer kullanıcı giriş yapmamışsa ve korumalı bir sayfadaysa -> /login'e at
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Eğer kullanıcı giriş yapmışsa ve /login sayfasındaysa -> /'a at
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

// 5. Middleware'in hangi yollarda çalışacağını belirliyoruz
export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar hariç tüm yolları kontrol et:
     * - _next/static (JS/CSS dosyaları)
     * - _next/image (Resimler)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}