import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VO_AI_API_KEY = "v1:13kXlWs2bvYSIxt7MDIHF5iM:gKFsdUCf70qwIxWJr1caFnCnrota"
const VO_AI_BASE_URL = "https://api.v0.dev"

export async function POST(request: NextRequest) {
  try {
    const { message, userUuid, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    // Rate limiting por UUID
    const supabase = await createClient()

    // Verificar rate limit (máximo 10 mensagens por hora por usuário)
    if (userUuid) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from("ai_chat_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userUuid)
        .gte("created_at", oneHourAgo)

      if (count && count >= 10) {
        return NextResponse.json(
          { error: "Limite de mensagens por hora excedido. Tente novamente mais tarde." },
          { status: 429 },
        )
      }
    }

    // Preparar contexto para a IA
    const systemPrompt = `Você é um assistente de suporte para o marketplace "Filipe Mavinga E-books". 
    Ajude usuários com:
    - Dúvidas sobre publicação de e-books (taxa de 500 Kz)
    - Processo de compra (preço padrão 767,04 AOA)
    - Problemas de pagamento via KuEnha Pay
    - Navegação no site
    - Políticas e termos de uso
    
    Contexto atual do usuário: ${context || "Página inicial"}
    
    Seja sempre educado, prestativo e direto nas respostas.`

    // Chamar VO AI API
    const aiResponse = await fetch(`${VO_AI_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VO_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        model: "gpt-4",
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    let aiMessage =
      "Desculpe, não consegui processar sua solicitação no momento. Tente novamente ou entre em contato conosco."
    let success = false

    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      aiMessage = aiData.choices?.[0]?.message?.content || aiMessage
      success = true
    }

    // Salvar log da conversa
    if (userUuid) {
      await supabase.from("ai_chat_logs").insert({
        user_id: userUuid,
        message: message,
        response: aiMessage,
        context: context,
        success: success,
        ip_address: request.ip || request.headers.get("x-forwarded-for"),
      })
    }

    return NextResponse.json({
      message: aiMessage,
      success: success,
    })
  } catch (error) {
    console.error("Erro na IA de suporte:", error)

    // Fallback response
    const fallbackResponses = [
      "Olá! Como posso ajudá-lo hoje? Posso esclarecer dúvidas sobre publicação, compras ou navegação no site.",
      "Para publicar um e-book, você precisa pagar uma taxa de 500 Kz. Após aprovação, seu livro ficará disponível por 767,04 AOA.",
      "Se você está com problemas no pagamento, verifique se os dados estão corretos ou tente novamente em alguns minutos.",
      "Para mais informações, consulte nossa seção de ajuda ou entre em contato conosco diretamente.",
    ]

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

    return NextResponse.json({
      message: randomResponse,
      success: false,
    })
  }
}
