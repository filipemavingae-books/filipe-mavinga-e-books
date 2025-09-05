import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Book, Calendar } from "lucide-react"

interface PerfilPageProps {
  params: {
    slug: string
  }
}

export default async function PerfilPage({ params }: PerfilPageProps) {
  const supabase = await createClient()

  // Extrair username e UUID do slug
  const slugParts = params.slug.split("-")
  if (slugParts.length < 2) {
    notFound()
  }

  const uuid = slugParts[slugParts.length - 1]
  const username = slugParts.slice(0, -1).join("-")

  // Buscar usuário
  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("uuid", uuid)
    .eq("username", username)
    .single()

  if (error || !userData) {
    notFound()
  }

  // Buscar publicações aprovadas do usuário
  const { data: publications } = await supabase
    .from("publications")
    .select("*")
    .eq("user_id", userData.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header do perfil */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-orange-900">{userData.full_name || userData.username}</CardTitle>
                <p className="text-orange-700">@{userData.username}</p>
                <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  Membro desde {new Date(userData.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            {userData.bio && <p className="mt-4 text-orange-800">{userData.bio}</p>}
          </CardHeader>
        </Card>

        {/* Publicações */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-2">
            <Book className="w-6 h-6" />
            Publicações ({publications?.length || 0})
          </h2>

          {publications && publications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map((publication) => (
                <Card key={publication.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-[3/4] bg-orange-100 rounded-lg mb-3 flex items-center justify-center">
                      {publication.cover_url ? (
                        <img
                          src={publication.cover_url || "/placeholder.svg"}
                          alt={publication.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Book className="w-12 h-12 text-orange-400" />
                      )}
                    </div>
                    <CardTitle className="text-lg text-orange-900 line-clamp-2">{publication.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-orange-700 mb-2">Por {publication.author_name}</p>
                    <p className="text-orange-800 text-sm line-clamp-3 mb-3">{publication.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-orange-600">{publication.price} AOA</span>
                      <span className="text-xs text-orange-500">{publication.genre}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-orange-200">
              <CardContent className="text-center py-8">
                <Book className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                <p className="text-orange-700">Este autor ainda não publicou nenhum e-book.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Gerar metadata dinâmica para SEO e Open Graph
export async function generateMetadata({ params }: PerfilPageProps) {
  const supabase = await createClient()

  const slugParts = params.slug.split("-")
  const uuid = slugParts[slugParts.length - 1]
  const username = slugParts.slice(0, -1).join("-")

  const { data: userData } = await supabase.from("users").select("*").eq("uuid", uuid).eq("username", username).single()

  if (!userData) {
    return {
      title: "Perfil não encontrado - Filipe Mavinga E-books",
    }
  }

  return {
    title: `${userData.full_name || userData.username} - Filipe Mavinga E-books`,
    description: userData.bio || `Perfil de ${userData.full_name || userData.username} no Filipe Mavinga E-books`,
    openGraph: {
      title: `${userData.full_name || userData.username} - Filipe Mavinga E-books`,
      description: userData.bio || `Perfil de ${userData.full_name || userData.username} no Filipe Mavinga E-books`,
      images: userData.avatar_url ? [userData.avatar_url] : [],
    },
  }
}
