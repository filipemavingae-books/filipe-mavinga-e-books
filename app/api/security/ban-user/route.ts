import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, reason, duration, banType } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ error: "ID do usuário e motivo são obrigatórios" }, { status: 400 })
    }

    // Verificar se o usuário atual é admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Calcular data de expiração do ban
    let expiresAt = null
    if (duration && duration !== "permanent") {
      const durationMs = parseDuration(duration)
      expiresAt = new Date(Date.now() + durationMs).toISOString()
    }

    // Criar registro de ban
    const { error: banError } = await supabase.from("user_bans").insert({
      user_id: userId,
      banned_by: user.id,
      reason: reason,
      ban_type: banType || "temporary",
      expires_at: expiresAt,
      is_active: true,
    })

    if (banError) {
      return NextResponse.json({ error: "Erro ao aplicar ban" }, { status: 500 })
    }

    // Atualizar status do usuário
    await supabase.from("user_profiles").update({ status: "banned" }).eq("user_id", userId)

    // Log da ação administrativa
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action_type: "ban_user",
      target_user_id: userId,
      details: {
        reason: reason,
        duration: duration,
        ban_type: banType,
      },
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
    })

    return NextResponse.json({ success: true, message: "Usuário banido com sucesso" })
  } catch (error) {
    console.error("Erro ao banir usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function parseDuration(duration: string): number {
  const units: { [key: string]: number } = {
    m: 60 * 1000, // minutos
    h: 60 * 60 * 1000, // horas
    d: 24 * 60 * 60 * 1000, // dias
    w: 7 * 24 * 60 * 60 * 1000, // semanas
  }

  const match = duration.match(/^(\d+)([mhdw])$/)
  if (!match) return 24 * 60 * 60 * 1000 // padrão: 1 dia

  const [, amount, unit] = match
  return Number.parseInt(amount) * (units[unit] || units.d)
}
