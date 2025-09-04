import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const orderId = params.id

    // Verificar autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar pedido com itens
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items!inner(
          *,
          publications!inner(*)
        )
      `)
      .eq("id", orderId)
      .eq("buyer_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Buscar dados do usuário
    const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

    // Gerar recibo em HTML (em produção, usar biblioteca de PDF)
    const receiptHtml = generateReceiptHTML(order, userData)

    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="recibo-${orderId}.html"`,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar recibo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function generateReceiptHTML(order: any, userData: any) {
  const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR")
  const orderTime = new Date(order.created_at).toLocaleTimeString("pt-BR")

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo - Pedido ${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #ea580c;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          color: #ea580c;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .receipt-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-section h3 {
          color: #ea580c;
          margin-bottom: 10px;
          border-bottom: 1px solid #fed7aa;
          padding-bottom: 5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #fed7aa;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #fed7aa;
          color: #9a3412;
          font-weight: bold;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #ea580c;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          color: #ea580c;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">📚 Filipe Mavinga E-books</div>
        <h1>Recibo de Compra</h1>
        <p>Pedido #${order.id}</p>
      </div>

      <div class="receipt-info">
        <div class="info-section">
          <h3>Informações do Cliente</h3>
          <p><strong>Nome:</strong> ${userData?.full_name || userData?.username || "N/A"}</p>
          <p><strong>E-mail:</strong> ${userData?.email || "N/A"}</p>
          <p><strong>UUID:</strong> ${userData?.uuid || "N/A"}</p>
        </div>
        
        <div class="info-section">
          <h3>Informações do Pedido</h3>
          <p><strong>Data:</strong> ${orderDate}</p>
          <p><strong>Hora:</strong> ${orderTime}</p>
          <p><strong>Status:</strong> ${order.status === "completed" ? "Pago" : "Pendente"}</p>
          <p><strong>Referência:</strong> ${order.gateway_ref || "N/A"}</p>
        </div>
      </div>

      <h3>Itens Comprados</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>E-book</th>
            <th>Autor</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items
            .map(
              (item: any) => `
            <tr>
              <td>${item.publications.title}</td>
              <td>${item.publications.author_name}</td>
              <td>${item.quantity}</td>
              <td>${item.price} AOA</td>
              <td>${(item.price * item.quantity).toFixed(2)} AOA</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="total-section">
        <p><strong>Subtotal:</strong> ${order.total} AOA</p>
        <p><strong>Taxa de processamento:</strong> 0,00 AOA</p>
        <p class="total">Total: ${order.total} AOA</p>
      </div>

      <div class="footer">
        <p>Filipe Mavinga E-books - Transforme leitores em autores</p>
        <p>Este é um recibo eletrônico válido para fins fiscais</p>
        <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </body>
    </html>
  `
}
