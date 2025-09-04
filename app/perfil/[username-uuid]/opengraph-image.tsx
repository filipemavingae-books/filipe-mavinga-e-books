import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Perfil - Filipe Mavinga E-books"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: { "username-uuid": string } }) {
  try {
    const supabase = await createClient()
    const [username, uuid] = params["username-uuid"].split("-")

    // Buscar dados do perfil
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("username", username)
      .eq("uuid", uuid)
      .single()

    if (!profile) {
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
            Perfil não encontrado
          </div>
        </div>,
        {
          ...size,
        },
      )
    }

    // Buscar contagem de publicações
    const { count: publicationsCount } = await supabase
      .from("publications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("status", "approved")

    return new ImageResponse(
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "75px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "30px",
              border: "4px solid rgba(255,255,255,0.3)",
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.full_name}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "75px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 60,
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {profile.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* Nome */}
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              marginBottom: 20,
            }}
          >
            {profile.full_name}
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 30,
            }}
          >
            @{profile.username}
          </div>

          {/* Estatísticas */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#fef3c7",
                }}
              >
                {publicationsCount || 0}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Publicações
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                maxWidth: "600px",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {profile.bio.length > 100 ? `${profile.bio.substring(0, 100)}...` : profile.bio}
            </div>
          )}

          {/* Marca */}
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Filipe Mavinga E-books
          </div>
        </div>
      </div>,
      {
        ...size,
      },
    )
  } catch (error) {
    console.error("Erro ao gerar imagem OG do perfil:", error)

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
