"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Book, Search, Filter, ShoppingCart, Star, User } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"

interface Publication {
  id: string
  title: string
  description: string
  author_name: string
  price: number
  genre: string
  cover_url: string
  created_at: string
  users: {
    username: string
    uuid: string
    full_name: string
  }
}

const genres = [
  "Todos",
  "Ficção",
  "Romance",
  "Mistério",
  "Fantasia",
  "Ficção Científica",
  "Biografia",
  "História",
  "Negócios",
  "Autoajuda",
  "Educação",
  "Tecnologia",
  "Saúde",
  "Culinária",
  "Arte",
  "Outros",
]

const sortOptions = [
  { value: "newest", label: "Mais Recentes" },
  { value: "oldest", label: "Mais Antigos" },
  { value: "price_low", label: "Menor Preço" },
  { value: "price_high", label: "Maior Preço" },
  { value: "title", label: "Título A-Z" },
]

export default function LojaPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Todos")
  const [sortBy, setSortBy] = useState("newest")
  const { addItem, items } = useCart()

  useEffect(() => {
    fetchPublications()
  }, [])

  useEffect(() => {
    filterAndSortPublications()
  }, [publications, searchTerm, selectedGenre, sortBy])

  const fetchPublications = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("publications")
        .select(`
          *,
          users!inner(username, uuid, full_name)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPublications(data || [])
    } catch (error) {
      console.error("Erro ao buscar publicações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortPublications = () => {
    let filtered = [...publications]

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (pub) =>
          pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por gênero
    if (selectedGenre !== "Todos") {
      filtered = filtered.filter((pub) => pub.genre === selectedGenre)
    }

    // Ordenar
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "price_low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price_high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    setFilteredPublications(filtered)
  }

  const handleAddToCart = (publication: Publication) => {
    addItem({
      id: publication.id,
      title: publication.title,
      author: publication.author_name,
      price: publication.price,
      cover_url: publication.cover_url,
      username: publication.users.username,
    })
  }

  const isInCart = (publicationId: string) => {
    return items.some((item) => item.id === publicationId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-orange-700">Carregando e-books...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header da loja */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Loja de E-books</h1>
          <p className="text-orange-700">Descubra e compre e-books incríveis de autores talentosos</p>
        </div>

        {/* Filtros e busca */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Filter className="w-5 h-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                <Input
                  placeholder="Buscar e-books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500"
                />
              </div>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500">
                  <SelectValue placeholder="Gênero" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-orange-700 flex items-center">
                {filteredPublications.length} e-book{filteredPublications.length !== 1 ? "s" : ""} encontrado
                {filteredPublications.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de e-books */}
        {filteredPublications.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="text-center py-12">
              <Book className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Nenhum e-book encontrado</h3>
              <p className="text-orange-700">Tente ajustar os filtros ou buscar por outros termos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPublications.map((publication) => (
              <Card
                key={publication.id}
                className="border-orange-200 hover:shadow-lg transition-all duration-300 group"
              >
                <CardHeader className="p-0">
                  <Link href={`/${publication.users.username}/publicacao/${publication.id}`}>
                    <div className="aspect-[3/4] bg-orange-100 rounded-t-lg overflow-hidden">
                      {publication.cover_url ? (
                        <img
                          src={publication.cover_url || "/placeholder.svg"}
                          alt={publication.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book className="w-16 h-16 text-orange-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="p-4">
                  <Link href={`/${publication.users.username}/publicacao/${publication.id}`}>
                    <CardTitle className="text-lg text-orange-900 line-clamp-2 mb-2 hover:text-orange-700 transition-colors">
                      {publication.title}
                    </CardTitle>
                  </Link>

                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3 h-3 text-orange-500" />
                    <Link
                      href={`/perfil/${publication.users.username}-${publication.users.uuid}`}
                      className="text-sm text-orange-600 hover:text-orange-500 transition-colors"
                    >
                      {publication.author_name}
                    </Link>
                  </div>

                  <p className="text-sm text-orange-700 line-clamp-3 mb-3">{publication.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {publication.genre}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-orange-600">4.5</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-orange-600">{publication.price} AOA</span>

                    {isInCart(publication.id) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                        disabled
                      >
                        No Carrinho
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(publication)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    )}
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
