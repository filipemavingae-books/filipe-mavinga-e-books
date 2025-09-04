import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const headersList = await headers()

    // Verificar assinatura do webhook (em produção, implementar verificação real)
    const signature = headersList.get("x-kuenha-signature")

    console.log("[v0] Webhook KuEnha Pay recebido:", body)

    const { reference, status, amount, currency, transaction_id, customer_email, customer_name, payment_method } = body

    if (!reference) {
      return NextResponse.json({ error: "Reference não fornecida" }, { status: 400 })
    }

    // Buscar pedido pelo reference
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", reference).single()

    if (orderError || !order) {
      console.log("[v0] Pedido não encontrado:", reference)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Processar diferentes status de pagamento
    let newStatus = order.status

    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        newStatus = "completed"
        break
      case "failed":
      case "cancelled":
      case "declined":
        newStatus = "failed"
        break
      case "pending":
        newStatus = "pending"
        break
      default:
        console.log("[v0] Status desconhecido:", status)
        return NextResponse.json({ error: "Status desconhecido" }, { status: 400 })
    }

    // Atualizar pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        gateway_ref: transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reference)

    if (updateError) {
      console.error("[v0] Erro ao atualizar pedido:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    // Registrar pagamento
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: order.buyer_id,
      type: "ebook_purchase",
      amount: Number.parseFloat(amount),
      status: newStatus === "completed" ? "completed" : "failed",
      gateway_ref: transaction_id,
      metadata: {
        order_id: reference,
        payment_method,
        customer_email,
        customer_name,
      },
    })

    if (paymentError) {
      console.error("[v0] Erro ao registrar pagamento:", paymentError)
    }

    // Log do evento
    await supabase.from("event_logs").insert({
      user_id: order.buyer_id,
      event_type: "payment_webhook",
      reference_id: reference,
      metadata: {
        status: newStatus,
        transaction_id,
        amount,
        currency,
        webhook_body: body,
      },
    })

    // Se pagamento foi completado, processar entrega
    if (newStatus === "completed") {
      await processOrderDelivery(order.id, supabase)
    }

    console.log("[v0] Webhook processado com sucesso:", reference, newStatus)

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      order_id: reference,
      status: newStatus,
    })
  } catch (error) {
    console.error("[v0] Erro no webhook KuEnha Pay:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function processOrderDelivery(orderId: string, supabase: any) {
  try {
    // Buscar itens do pedido
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select(`
        *,
        publications!inner(*)
      `)
      .eq("order_id", orderId)

    if (error || !orderItems) {
      console.error("[v0] Erro ao buscar itens do pedido:", error)
      return
    }

    // Aqui você pode implementar:
    // 1. Envio de e-mail com links de download
    // 2. Geração de recibos em PDF
    // 3. Notificações push
    // 4. Atualização de estatísticas de vendas

    console.log("[v0] Processando entrega para pedido:", orderId)
    console.log("[v0] Itens:", orderItems.length)

    // Log de entrega processada
    await supabase.from("event_logs").insert({
      user_id: orderItems[0]?.publications?.user_id,
      event_type: "order_delivered",
      reference_id: orderId,
      metadata: {
        items_count: orderItems.length,
        delivery_processed_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao processar entrega:", error)
  }
}
