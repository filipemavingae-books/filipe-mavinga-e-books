"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book, Edit, Eye, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface Publication {
  id: string
  title: string
  description: string
  author_name: string
  price: number
  genre: string
  status: "pending" | "approved" | "rejected" | "inactive"
  cover_url: string
  created_at: string
  updated_at: string
}

export default function MinhasPublicacoesPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPublications(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Inativo
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-orange-700">Carregando suas publicações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-900 mb-2">Minhas Publicações</h1>
            <p className="text-orange-700">Gerencie todos os seus e-books publicados</p>
          </div>
          <Link href="/publicar">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Book className="w-4 h-4 mr-2" />
              Nova Publicação
            </Button>
          </Link>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {publications.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="text-center py-12">
              <Book className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Nenhuma publicação ainda</h3>
              <p className="text-orange-700 mb-6">Comece publicando seu primeiro e-book!</p>
              <Link href="/publicar">
                <Button className="bg-orange-600 hover:bg-orange-700">Publicar Primeiro E-book</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((publication) => (
              <Card key={publication.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-[3/4] bg-orange-100 rounded-lg mb-3 overflow-hidden">
                    {publication.cover_url ? (
                      <img
                        src={publication.cover_url || "/placeholder.svg"}
                        alt={publication.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-12 h-12 text-orange-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg text-orange-900 line-clamp-2 flex-1">{publication.title}</CardTitle>
                    {getStatusBadge(publication.status)}
                  </div>
                  <CardDescription className="text-orange-700">Por {publication.author_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-800 line-clamp-3 mb-4">{publication.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-orange-600">{publication.price} AOA</span>
                    <span className="text-xs text-orange-500 bg-orange-100 px-2 py-1 rounded">{publication.genre}</span>
                  </div>

                  <div className="text-xs text-orange-600 mb-4">
                    Criado em {new Date(publication.created_at).toLocaleDateString("pt-BR")}
                  </div>

                  <div className="flex gap-2">
                    {publication.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    )}

                    {(publication.status === "pending" || publication.status === "rejected") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
