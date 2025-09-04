import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VO_AI_API_KEY = "v1:13kXlWs2bvYSIxt7MDIHF5iM:gKFsdUCf70qwIxWJr1caFnCnrota"
const VO_AI_BASE_URL = "https://api.v0.dev"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 })
    }

    // Verificar autenticação
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const prompt = `Analise o seguinte texto e determine se contém conteúdo inadequado:

    Texto: "${text}"
    Tipo: ${type || "geral"}

    Verifique se há:
    - Linguagem ofensiva ou hate speech
    - Conteúdo sexual explícito
    - Violência ou ameaças
    - Spam ou conteúdo promocional excessivo
    - Informações falsas ou enganosas
    - Violação de direitos autorais

    Responda apenas com:
    - "APROVADO" se o conteúdo está adequado
    - "REJEITADO: [motivo]" se há problemas
    
    Seja rigoroso mas justo na análise.`

    let moderationResult = "APROVADO"
    let success = false

    try {
      // Chamar VO AI API
      const aiResponse = await fetch(`${VO_AI_BASE_URL}/moderate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VO_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 100,
          temperature: 0.1,
        }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        moderationResult = aiData.text || aiData.choices?.[0]?.text || "APROVADO"
        success = true
      }
    } catch (error) {
      console.error("Erro na moderação IA:", error)
    }

    // Fallback: verificação básica por palavras-chave
    if (!success) {
      const inappropriateWords = ["spam", "fake", "falso", "golpe", "fraude", "hack", "pirata", "ilegal", "drogas"]

      const textLower = text.toLowerCase()
      const foundInappropriate = inappropriateWords.some((word) => textLower.includes(word))

      if (foundInappropriate) {
        moderationResult = "REJEITADO: Conteúdo potencialmente inadequado detectado"
      }
    }

    // Salvar log da moderação
    await supabase.from("ai_moderation_logs").insert({
      user_id: user.id,
      text_analyzed: text.substring(0, 500), // Limitar tamanho
      moderation_result: moderationResult,
      content_type: type,
      success: success,
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
    })

    const isApproved = moderationResult.startsWith("APROVADO")
    const reason = isApproved ? null : moderationResult.replace("REJEITADO: ", "")

    return NextResponse.json({
      approved: isApproved,
      reason: reason,
      success: success,
    })
  } catch (error) {
    console.error("Erro na moderação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
