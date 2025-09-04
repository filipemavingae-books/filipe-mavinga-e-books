import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Log de acesso para auditoria
  if (user && request.nextUrl.pathname !== "/api/log") {
    try {
      await supabase.from("event_logs").insert({
        user_id: user.id,
        event_type: "page_access",
        route: request.nextUrl.pathname,
        ip_address: request.ip || request.headers.get("x-forwarded-for"),
        user_agent: request.headers.get("user-agent"),
        metadata: {
          method: request.method,
          url: request.url,
        },
      })
    } catch (error) {
      console.error("Erro ao registrar log:", error)
    }
  }

  // Redirecionar para login se não autenticado em rotas protegidas
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/meu-painel") ||
      request.nextUrl.pathname.startsWith("/publicar") ||
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirecionar para painel se já autenticado em rotas de auth
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/cadastro"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/meu-painel"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
