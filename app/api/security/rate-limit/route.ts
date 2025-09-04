import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RateLimitConfig {
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
}

const DEFAULT_LIMITS: RateLimitConfig = {
  requests_per_minute: 60,
  requests_per_hour: 1000,
  requests_per_day: 10000,
}

export async function POST(request: NextRequest) {
  try {
    const { action, identifier } = await request.json()

    if (!action || !identifier) {
      return NextResponse.json({ error: "Ação e identificador são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()
    const clientIp = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    // Verificar rate limits
    const isAllowed = await checkRateLimit(supabase, identifier, clientIp, action)

    if (!isAllowed.allowed) {
      // Log da tentativa de abuso
      await supabase.from("security_logs").insert({
        event_type: "rate_limit_exceeded",
        identifier: identifier,
        ip_address: clientIp,
        action: action,
        metadata: {
          user_agent: request.headers.get("user-agent"),
          referer: request.headers.get("referer"),
        },
      })

      return NextResponse.json(
        {
          error: "Rate limit excedido",
          retry_after: isAllowed.retry_after,
          limit_type: isAllowed.limit_type,
        },
        { status: 429 },
      )
    }

    // Registrar a requisição
    await supabase.from("rate_limit_logs").insert({
      identifier: identifier,
      ip_address: clientIp,
      action: action,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Erro no rate limiting:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function checkRateLimit(
  supabase: any,
  identifier: string,
  ip: string,
  action: string,
): Promise<{ allowed: boolean; retry_after?: number; limit_type?: string }> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Verificar limite por minuto
  const { count: minuteCount } = await supabase
    .from("rate_limit_logs")
    .select("*", { count: "exact", head: true })
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .eq("action", action)
    .gte("timestamp", oneMinuteAgo.toISOString())

  if (minuteCount && minuteCount >= DEFAULT_LIMITS.requests_per_minute) {
    return { allowed: false, retry_after: 60, limit_type: "minute" }
  }

  // Verificar limite por hora
  const { count: hourCount } = await supabase
    .from("rate_limit_logs")
    .select("*", { count: "exact", head: true })
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .eq("action", action)
    .gte("timestamp", oneHourAgo.toISOString())

  if (hourCount && hourCount >= DEFAULT_LIMITS.requests_per_hour) {
    return { allowed: false, retry_after: 3600, limit_type: "hour" }
  }

  // Verificar limite por dia
  const { count: dayCount } = await supabase
    .from("rate_limit_logs")
    .select("*", { count: "exact", head: true })
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .eq("action", action)
    .gte("timestamp", oneDayAgo.toISOString())

  if (dayCount && dayCount >= DEFAULT_LIMITS.requests_per_day) {
    return { allowed: false, retry_after: 86400, limit_type: "day" }
  }

  return { allowed: true }
}
