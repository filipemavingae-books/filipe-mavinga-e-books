import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Publicação - Filipe Mavinga E-books"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: { username: string; id: string } }) {
  try {
    const supabase = await createClient()

    // Buscar dados da publicação
    const { data: publication } = await supabase
      .from("publications")
      .select(
        `
        *,
        user_profiles!publications_user_id_fkey (
          username,
          full_name
        )
      `,
      )
      .eq("id", params.id)
      .eq("status", "approved")
      .single()

    if (!publication) {
      return new ImageResponse(
        <div
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontFamily: "system-ui",
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
            }}
          >
            Filipe Mavinga E-books
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.9)",
              marginTop: 20,
            }}
          >
            Publicação não encontrada
          </div>
        </div>,
        {
          ...size,
        },
      )
    }

    return new ImageResponse(
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "system-ui",
        }}
      >
        {/* Conteúdo do texto */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingRight: "40px",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {publication.title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 20,
            }}
          >
            por {publication.user_profiles?.full_name || publication.author_name}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#fef3c7",
              marginBottom: 30,
            }}
          >
            {publication.price.toLocaleString("pt-AO")} AOA
          </div>
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Filipe Mavinga E-books
          </div>
        </div>

        {/* Imagem da capa (se disponível) */}
        {publication.cover_image_url && (
          <div
            style={{
              width: "300px",
              height: "400px",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <img
              src={publication.cover_image_url || "/placeholder.svg"}
              alt={publication.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>,
      {
        ...size,
      },
    )
  } catch (error) {
    console.error("Erro ao gerar imagem OG:", error)

    return new ImageResponse(
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
          }}
        >
          Filipe Mavinga E-books
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            marginTop: 20,
          }}
        >
          Transforme leitores em autores
        </div>
      </div>,
      {
        ...size,
      },
    )
  }
}
