import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { orderId, transactionId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID é obrigatório" }, { status: 400 })
    }

    // Buscar pedido
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem permissão para ver este pedido
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== order.buyer_id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Em um cenário real, você faria uma chamada para a API do KuEnha Pay
    // para verificar o status do pagamento
    // Por enquanto, vamos simular a verificação

    let paymentStatus = "pending"

    // Simular verificação com KuEnha Pay API
    if (transactionId) {
      // Aqui você faria: const response = await fetch(`https://api.kuenha.com/payments/${transactionId}`)
      // Por enquanto, vamos assumir que o pagamento foi processado
      paymentStatus = "completed"
    }

    // Atualizar status do pedido se necessário
    if (paymentStatus === "completed" && order.status !== "completed") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "completed",
          gateway_ref: transactionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (updateError) {
        console.error("[v0] Erro ao atualizar pedido:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: paymentStatus === "completed" ? "completed" : order.status,
        total: order.total,
        created_at: order.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Erro na verificação de pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
