"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Book, Search, Filter, CheckCircle, XCircle, Eye, Clock, User } from "lucide-react"
import Link from "next/link"

interface Publication {
  id: string
  title: string
  description: string
  author_name: string
  price: number
  genre: string
  status: "pending" | "approved" | "rejected"
  cover_url: string
  created_at: string
  users: {
    username: string
    uuid: string
    full_name: string
    email: string
  }
}

export default function AdminPublicacoesPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPublications()
  }, [])

  useEffect(() => {
    filterPublications()
  }, [publications, searchTerm, statusFilter])

  const fetchPublications = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("publications")
        .select(`
          *,
          users!inner(username, uuid, full_name, email)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPublications(data || [])
    } catch (error) {
      console.error("Erro ao buscar publicações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPublications = () => {
    let filtered = [...publications]

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (pub) =>
          pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.users.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((pub) => pub.status === statusFilter)
    }

    setFilteredPublications(filtered)
  }

  const handleApprove = async (publicationId: string) => {
    setIsProcessing(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("publications")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", publicationId)

      if (error) throw error

      // Log da ação
      await supabase.from("event_logs").insert({
        event_type: "publication_approved",
        reference_id: publicationId,
        metadata: {
          admin_action: true,
          note: reviewNote || "Aprovado pelo admin",
        },
      })

      fetchPublications()
      setSelectedPublication(null)
      setReviewNote("")
    } catch (error) {
      console.error("Erro ao aprovar publicação:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (publicationId: string) => {
    setIsProcessing(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("publications")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", publicationId)

      if (error) throw error

      // Log da ação
      await supabase.from("event_logs").insert({
        event_type: "publication_rejected",
        reference_id: publicationId,
        metadata: {
          admin_action: true,
          note: reviewNote || "Rejeitado pelo admin",
        },
      })

      fetchPublications()
      setSelectedPublication(null)
      setReviewNote("")
    } catch (error) {
      console.error("Erro ao rejeitar publicação:", error)
    } finally {
      setIsProcessing(false)
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
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-orange-700">Carregando publicações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Gerenciar Publicações</h1>
          <p className="text-orange-700">Aprovar, rejeitar e gerenciar e-books submetidos</p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                <Input
                  placeholder="Buscar publicações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-orange-700 flex items-center">
                {filteredPublications.length} publicação{filteredPublications.length !== 1 ? "ões" : ""} encontrada
                {filteredPublications.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de publicações */}
        <div className="space-y-4">
          {filteredPublications.map((publication) => (
            <Card key={publication.id} className="border-orange-200">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Capa */}
                  <div className="w-20 h-28 bg-orange-100 rounded-lg overflow-hidden flex-shrink-0">
                    {publication.cover_url ? (
                      <img
                        src={publication.cover_url || "/placeholder.svg"}
                        alt={publication.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-6 h-6 text-orange-400" />
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-orange-900 text-lg">{publication.title}</h3>
                        <p className="text-orange-700">Por {publication.author_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-orange-500" />
                          <span className="text-sm text-orange-600">
                            {publication.users.full_name || publication.users.username} ({publication.users.email})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(publication.status)}
                        <p className="text-lg font-bold text-orange-600 mt-1">{publication.price} AOA</p>
                      </div>
                    </div>

                    <p className="text-sm text-orange-800 line-clamp-2 mb-3">{publication.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          {publication.genre}
                        </Badge>
                        <span className="text-xs text-orange-500">
                          {new Date(publication.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPublication(publication)}
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Revisar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Revisar Publicação</DialogTitle>
                              <DialogDescription>Analise a publicação e tome uma decisão</DialogDescription>
                            </DialogHeader>

                            {selectedPublication && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informações</h4>
                                    <p>
                                      <strong>Título:</strong> {selectedPublication.title}
                                    </p>
                                    <p>
                                      <strong>Autor:</strong> {selectedPublication.author_name}
                                    </p>
                                    <p>
                                      <strong>Preço:</strong> {selectedPublication.price} AOA
                                    </p>
                                    <p>
                                      <strong>Gênero:</strong> {selectedPublication.genre}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Usuário</h4>
                                    <p>
                                      <strong>Nome:</strong> {selectedPublication.users.full_name}
                                    </p>
                                    <p>
                                      <strong>Username:</strong> {selectedPublication.users.username}
                                    </p>
                                    <p>
                                      <strong>E-mail:</strong> {selectedPublication.users.email}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Descrição</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedPublication.description}</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                                  <Textarea
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Adicione observações sobre a decisão..."
                                    className="border-orange-200 focus:border-orange-500"
                                  />
                                </div>

                                {selectedPublication.status === "pending" && (
                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => handleApprove(selectedPublication.id)}
                                      disabled={isProcessing}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      {isProcessing ? "Processando..." : "Aprovar"}
                                    </Button>
                                    <Button
                                      onClick={() => handleReject(selectedPublication.id)}
                                      disabled={isProcessing}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      {isProcessing ? "Processando..." : "Rejeitar"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Link href={`/${publication.users.username}/publicacao/${publication.id}`} target="_blank">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                          >
                            Ver Página
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPublications.length === 0 && (
          <Card className="border-orange-200">
            <CardContent className="text-center py-12">
              <Book className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Nenhuma publicação encontrada</h3>
              <p className="text-orange-700">Tente ajustar os filtros ou aguarde novas submissões.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
