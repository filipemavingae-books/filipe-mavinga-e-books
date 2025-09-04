import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book, User, Calendar, Tag, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface PublicacaoPageProps {
  params: {
    username: string
    id: string
  }
}

export default async function PublicacaoPage({ params }: PublicacaoPageProps) {
  const supabase = await createClient()

  // Buscar publicação
  const { data: publication, error } = await supabase
    .from("publications")
    .select(`
      *,
      users!inner(username, full_name, uuid, avatar_url, bio)
    `)
    .eq("id", params.id)
    .eq("status", "approved")
    .single()

  if (error || !publication) {
    notFound()
  }

  // Verificar se o username corresponde
  if (publication.users.username !== params.username) {
    notFound()
  }

  // Buscar outras publicações do autor
  const { data: otherPublications } = await supabase
    .from("publications")
    .select("*")
    .eq("user_id", publication.user_id)
    .eq("status", "approved")
    .neq("id", params.id)
    .limit(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações principais */}
            <div className="lg:col-span-2">
              <Card className="border-orange-200 mb-6">
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Capa */}
                    <div className="w-full md:w-64 aspect-[3/4] bg-orange-100 rounded-lg overflow-hidden flex-shrink-0">
                      {publication.cover_url ? (
                        <img
                          src={publication.cover_url || "/placeholder.svg"}
                          alt={publication.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book className="w-16 h-16 text-orange-400" />
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1">
                      <CardTitle className="text-3xl text-orange-900 mb-2">{publication.title}</CardTitle>
                      <p className="text-lg text-orange-700 mb-4">Por {publication.author_name}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {publication.genre}
                        </Badge>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(publication.created_at).toLocaleDateString("pt-BR")}
                        </Badge>
                      </div>

                      <div className="text-3xl font-bold text-orange-600 mb-4">{publication.price} AOA</div>

                      <div className="flex gap-3">
                        <Button className="bg-orange-600 hover:bg-orange-700 flex-1">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                        <Button className="bg-orange-700 hover:bg-orange-800">Comprar Agora</Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Descrição */}
              <Card className="border-orange-200 mb-6">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-900">Sobre este E-book</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-800 leading-relaxed whitespace-pre-line">{publication.description}</p>

                  {publication.tags && publication.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-orange-900 mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {publication.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informações do autor */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Sobre o Autor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                      {publication.users.avatar_url ? (
                        <img
                          src={publication.users.avatar_url || "/placeholder.svg"}
                          alt={publication.users.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900">
                        {publication.users.full_name || publication.users.username}
                      </h4>
                      <p className="text-sm text-orange-600">@{publication.users.username}</p>
                    </div>
                  </div>

                  {publication.users.bio && <p className="text-sm text-orange-700 mb-3">{publication.users.bio}</p>}

                  <Link href={`/perfil/${publication.users.username}-${publication.users.uuid}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Outras publicações do autor */}
              {otherPublications && otherPublications.length > 0 && (
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-900">Outras Publicações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {otherPublications.map((pub) => (
                      <Link key={pub.id} href={`/${publication.users.username}/publicacao/${pub.id}`} className="block">
                        <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors">
                          <div className="w-12 h-16 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                            {pub.cover_url ? (
                              <img
                                src={pub.cover_url || "/placeholder.svg"}
                                alt={pub.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Book className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-orange-900 text-sm line-clamp-2">{pub.title}</h5>
                            <p className="text-xs text-orange-600">{pub.price} AOA</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gerar metadata dinâmica para SEO e Open Graph
export async function generateMetadata({ params }: PublicacaoPageProps) {
  const supabase = await createClient()

  const { data: publication } = await supabase
    .from("publications")
    .select(`
      *,
      users!inner(username, full_name)
    `)
    .eq("id", params.id)
    .eq("status", "approved")
    .single()

  if (!publication) {
    return {
      title: "Publicação não encontrada - Filipe Mavinga E-books",
    }
  }

  return {
    title: `${publication.title} - ${publication.author_name} | Filipe Mavinga E-books`,
    description:
      publication.description?.substring(0, 160) || `E-book ${publication.title} por ${publication.author_name}`,
    openGraph: {
      title: `${publication.title} - ${publication.author_name}`,
      description:
        publication.description?.substring(0, 160) || `E-book ${publication.title} por ${publication.author_name}`,
      images: publication.cover_url ? [publication.cover_url] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${publication.title} - ${publication.author_name}`,
      description:
        publication.description?.substring(0, 160) || `E-book ${publication.title} por ${publication.author_name}`,
      images: publication.cover_url ? [publication.cover_url] : [],
    },
  }
}
