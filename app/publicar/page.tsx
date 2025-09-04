"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, DollarSign, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const genres = [
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

export default function PublicarPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorName: "",
    price: "767.04",
    genre: "",
    tags: "",
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [ebookFile, setEbookFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1) // 1: Formulário, 2: Pagamento, 3: Sucesso
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "ebook") => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === "cover") {
        // Validar imagem da capa
        if (!file.type.startsWith("image/")) {
          setError("A capa deve ser uma imagem (JPG, PNG, etc.)")
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB
          setError("A imagem da capa deve ter no máximo 5MB")
          return
        }
        setCoverFile(file)
      } else {
        // Validar arquivo do e-book
        const allowedTypes = ["application/pdf", "application/epub+zip", "text/plain"]
        if (!allowedTypes.includes(file.type) && !file.name.endsWith(".epub")) {
          setError("O e-book deve ser um arquivo PDF, EPUB ou TXT")
          return
        }
        if (file.size > 50 * 1024 * 1024) {
          // 50MB
          setError("O arquivo do e-book deve ter no máximo 50MB")
          return
        }
        setEbookFile(file)
      }
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Verificar se usuário está logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("Você precisa estar logado para publicar")
      }

      // Validações
      if (!coverFile) {
        throw new Error("Selecione uma imagem para a capa")
      }
      if (!ebookFile) {
        throw new Error("Selecione o arquivo do e-book")
      }

      // Upload da capa
      const coverFileName = `covers/${user.id}/${Date.now()}-${coverFile.name}`
      const { data: coverUpload, error: coverError } = await supabase.storage
        .from("ebooks")
        .upload(coverFileName, coverFile)

      if (coverError) throw coverError

      // Upload do e-book
      const ebookFileName = `files/${user.id}/${Date.now()}-${ebookFile.name}`
      const { data: ebookUpload, error: ebookError } = await supabase.storage
        .from("ebooks")
        .upload(ebookFileName, ebookFile)

      if (ebookError) throw ebookError

      // Obter URLs públicas
      const { data: coverUrl } = supabase.storage.from("ebooks").getPublicUrl(coverUpload.path)
      const { data: ebookUrl } = supabase.storage.from("ebooks").getPublicUrl(ebookUpload.path)

      // Criar publicação
      const { data: publication, error: pubError } = await supabase
        .from("publications")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          author_name: formData.authorName,
          price: Number.parseFloat(formData.price),
          genre: formData.genre,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          cover_url: coverUrl.publicUrl,
          file_url: ebookUrl.publicUrl,
          status: "pending",
        })
        .select()
        .single()

      if (pubError) throw pubError

      // Registrar log
      await supabase.from("event_logs").insert({
        user_id: user.id,
        event_type: "publication_created",
        reference_id: publication.id,
        metadata: {
          title: formData.title,
          price: formData.price,
          genre: formData.genre,
        },
      })

      // Ir para o pagamento
      setStep(2)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = () => {
    // Redirecionar para KuEnha Pay para pagamento da taxa de 500 Kz
    const paymentUrl = `https://pay.kuenha.com/59e228dc-0a24-45d5-a613-62dce8c096fc?amount=500&currency=AOA&description=Taxa de Publicação - Filipe Mavinga E-books&reference=${Date.now()}`
    window.open(paymentUrl, "_blank")
    setStep(3)
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-orange-200 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-orange-900">Pagamento da Taxa</CardTitle>
                <CardDescription className="text-orange-700">
                  Para publicar seu e-book, é necessário pagar a taxa de publicação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">Resumo da Publicação:</h3>
                  <p>
                    <strong>Título:</strong> {formData.title}
                  </p>
                  <p>
                    <strong>Autor:</strong> {formData.authorName}
                  </p>
                  <p>
                    <strong>Preço de Venda:</strong> {formData.price} AOA
                  </p>
                  <p>
                    <strong>Gênero:</strong> {formData.genre}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 mb-2">Taxa: 500 Kz</p>
                  <p className="text-sm text-orange-700 mb-6">
                    Após o pagamento, sua publicação será enviada para aprovação
                  </p>

                  <Button onClick={handlePayment} className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3">
                    Pagar com KuEnha Pay
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Após o pagamento, você será redirecionado e sua publicação entrará na fila de aprovação. Você
                    receberá uma notificação quando for aprovada ou se houver alguma observação.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-orange-200 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-orange-900">Publicação Enviada!</CardTitle>
                <CardDescription className="text-orange-700">
                  Sua publicação foi enviada com sucesso para aprovação
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-orange-800">
                  Após a confirmação do pagamento, sua publicação será analisada pela nossa equipe. Você receberá uma
                  notificação quando ela for aprovada.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/meu-painel")}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Ir para Meu Painel
                  </Button>
                  <Button
                    onClick={() => router.push("/loja")}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Explorar Loja
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-orange-900 mb-2">Publicar E-book</h1>
            <p className="text-orange-700">Publique seu e-book por apenas 500 Kz e comece a vender por 767,04 AOA</p>
          </div>

          <Card className="border-orange-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-900">Informações do E-book</CardTitle>
              <CardDescription className="text-orange-700">
                Preencha todos os campos para publicar seu e-book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-orange-900">
                      Título do E-book *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="border-orange-200 focus:border-orange-500"
                      placeholder="Digite o título do seu e-book"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorName" className="text-orange-900">
                      Nome do Autor *
                    </Label>
                    <Input
                      id="authorName"
                      name="authorName"
                      required
                      value={formData.authorName}
                      onChange={handleInputChange}
                      className="border-orange-200 focus:border-orange-500"
                      placeholder="Seu nome como autor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-orange-900">
                    Descrição *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    className="border-orange-200 focus:border-orange-500 min-h-[100px]"
                    placeholder="Descreva seu e-book, conte sobre o que se trata..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-orange-900">
                      Preço (AOA) *
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-orange-900">
                      Gênero *
                    </Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, genre: value }))}
                    >
                      <SelectTrigger className="border-orange-200 focus:border-orange-500">
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-orange-900">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="border-orange-200 focus:border-orange-500"
                      placeholder="romance, aventura, ficção"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-orange-900">Capa do E-book *</Label>
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "cover")}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                        <p className="text-orange-700">
                          {coverFile ? coverFile.name : "Clique para selecionar a capa"}
                        </p>
                        <p className="text-xs text-orange-500 mt-1">JPG, PNG até 5MB</p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-orange-900">Arquivo do E-book *</Label>
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.epub,.txt"
                        onChange={(e) => handleFileChange(e, "ebook")}
                        className="hidden"
                        id="ebook-upload"
                      />
                      <label htmlFor="ebook-upload" className="cursor-pointer">
                        <FileText className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                        <p className="text-orange-700">
                          {ebookFile ? ebookFile.name : "Clique para selecionar o arquivo"}
                        </p>
                        <p className="text-xs text-orange-500 mt-1">PDF, EPUB, TXT até 50MB</p>
                      </label>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">Próximos passos:</h3>
                  <ol className="list-decimal list-inside text-sm text-orange-700 space-y-1">
                    <li>Preencha todas as informações do seu e-book</li>
                    <li>Pague a taxa de publicação de 500 Kz</li>
                    <li>Aguarde a aprovação da nossa equipe</li>
                    <li>Seu e-book estará disponível na loja!</li>
                  </ol>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Continuar para Pagamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
