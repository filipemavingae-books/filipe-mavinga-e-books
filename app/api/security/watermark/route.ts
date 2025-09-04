import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, buyerUuid, orderHash } = await request.json()

    if (!fileUrl || !buyerUuid || !orderHash) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes" }, { status: 400 })
    }

    // Verificar autenticação
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o usuário tem permissão para acessar este arquivo
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .eq("id", orderHash)
      .eq("status", "completed")
      .single()

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado ou não autorizado" }, { status: 403 })
    }

    // Gerar marca d'água digital
    const watermark = {
      buyer_uuid: buyerUuid,
      order_hash: orderHash,
      download_timestamp: new Date().toISOString(),
      file_hash: generateFileHash(fileUrl, buyerUuid, orderHash),
    }

    // Em um cenário real, você aplicaria a marca d'água ao arquivo
    // Aqui vamos simular o processo e retornar a URL com marca d'água
    const watermarkedUrl = `${fileUrl}?watermark=${Buffer.from(JSON.stringify(watermark)).toString("base64")}`

    // Log da aplicação de marca d'água
    await supabase.from("watermark_logs").insert({
      user_id: user.id,
      order_id: orderHash,
      file_url: fileUrl,
      watermark_data: watermark,
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
    })

    return NextResponse.json({
      watermarked_url: watermarkedUrl,
      watermark_info: {
        applied: true,
        buyer_uuid: buyerUuid,
        timestamp: watermark.download_timestamp,
      },
    })
  } catch (error) {
    console.error("Erro ao aplicar marca d'água:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function generateFileHash(fileUrl: string, buyerUuid: string, orderHash: string): string {
  // Gerar hash único baseado nos dados do arquivo e comprador
  const data = `${fileUrl}-${buyerUuid}-${orderHash}-${Date.now()}`
  return Buffer.from(data).toString("base64").substring(0, 16)
}
