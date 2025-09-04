import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { event_type, url, timestamp } = await request.json()

    if (!event_type || !url) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes" }, { status: 400 })
    }

    const supabase = await createClient()

    // Tentar obter o usuário (opcional para telemetria)
    let userId = null
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch {
      // Usuário não autenticado, continuar sem user_id
    }

    // Salvar evento de telemetria
    await supabase.from("link_preview_logs").insert({
      user_id: userId,
      event_type: event_type,
      target_url: url,
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
      created_at: timestamp,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao registrar telemetria:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
