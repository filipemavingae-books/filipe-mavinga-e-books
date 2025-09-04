import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VO_AI_API_KEY = "v1:13kXlWs2bvYSIxt7MDIHF5iM:gKFsdUCf70qwIxWJr1caFnCnrota"
const VO_AI_BASE_URL = "https://api.v0.dev"

export async function POST(request: NextRequest) {
  try {
    const { title, genre, topics, userUuid } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
    }

    // Verificar autenticação
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Rate limiting (máximo 5 gerações por dia por usuário)
    const today = new Date().toISOString().split("T")[0]
    const { count } = await supabase
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("generation_type", "description")
      .gte("created_at", `${today}T00:00:00.000Z`)

    if (count && count >= 5) {
      return NextResponse.json(
        { error: "Limite diário de gerações excedido. Tente novamente amanhã." },
        { status: 429 },
      )
    }

    const prompt = `Crie uma descrição atraente e profissional para um e-book com as seguintes informações:
    
    Título: ${title}
    Gênero: ${genre || "Não especificado"}
    Tópicos: ${topics || "Não especificado"}
    
    A descrição deve:
    - Ter entre 100-200 palavras
    - Ser envolvente e despertar interesse
    - Destacar os benefícios para o leitor
    - Usar linguagem adequada ao gênero
    - Incluir uma chamada para ação sutil
    
    Retorne apenas a descrição, sem formatação adicional.`

    // Chamar VO AI API
    const aiResponse = await fetch(`${VO_AI_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VO_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    let generatedDescription = ""
    let success = false

    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      generatedDescription = aiData.text || aiData.choices?.[0]?.text || ""
      success = true
    }

    // Fallback se a IA falhar
    if (!generatedDescription) {
      generatedDescription = `Descubra "${title}" - um e-book ${genre ? `de ${genre.toLowerCase()}` : ""} que oferece insights valiosos e conhecimento prático. ${topics ? `Explore temas como ${topics} ` : ""}Este livro digital foi cuidadosamente elaborado para proporcionar uma experiência de leitura enriquecedora e transformadora. Ideal para quem busca aprendizado de qualidade e aplicação prática dos conceitos apresentados.`
    }

    // Salvar log da geração
    await supabase.from("ai_generation_logs").insert({
      user_id: user.id,
      generation_type: "description",
      input_data: { title, genre, topics },
      output_data: { description: generatedDescription },
      success: success,
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
    })

    return NextResponse.json({
      description: generatedDescription,
      success: success,
    })
  } catch (error) {
    console.error("Erro na geração de descrição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
