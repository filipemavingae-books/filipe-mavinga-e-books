"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { LinkPreviewModal } from "@/components/link-preview-modal"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    url: string
    title?: string
    description?: string
    imageUrl?: string
  } | null>(null)

  useEffect(() => {
    const url = searchParams.get("to")
    if (!url) {
      router.push("/")
      return
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      router.push("/")
      return
    }

    // Buscar metadados do link (simulado)
    const fetchPreviewData = async () => {
      try {
        // Em um cenário real, você faria uma chamada para uma API que extrai metadados
        const domain = new URL(url).hostname
        setPreviewData({
          url,
          title: `Conteúdo de ${domain}`,
          description: "Você está prestes a visitar um site externo. Verifique se é seguro prosseguir.",
          imageUrl: "/external-link-preview.jpg",
        })
        setIsModalOpen(true)
      } catch (error) {
        console.error("Erro ao buscar preview:", error)
        // Fallback: redirecionar diretamente
        window.location.href = url
      }
    }

    fetchPreviewData()
  }, [searchParams, router])

  const handleClose = () => {
    setIsModalOpen(false)
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <h1 className="text-xl font-semibold mb-4">Preparando preview...</h1>
        <p className="text-gray-600 mb-6">Aguarde enquanto carregamos as informações do link.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {previewData && (
        <LinkPreviewModal
          isOpen={isModalOpen}
          onClose={handleClose}
          url={previewData.url}
          title={previewData.title}
          description={previewData.description}
          imageUrl={previewData.imageUrl}
        />
      )}
    </div>
  )
}
