"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, X } from "lucide-react"
import Image from "next/image"

interface LinkPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  description?: string
  imageUrl?: string
}

export function LinkPreviewModal({ isOpen, onClose, url, title, description, imageUrl }: LinkPreviewModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já marcou para não mostrar novamente para este domínio
    const domain = new URL(url).hostname
    const savedPreference = localStorage.getItem(`link-preview-skip-${domain}`)
    if (savedPreference === "true") {
      handleProceed()
      return
    }
  }, [url])

  const handleProceed = () => {
    if (dontShowAgain) {
      const domain = new URL(url).hostname
      localStorage.setItem(`link-preview-skip-${domain}`, "true")
    }

    // Log de telemetria
    logPreviewEvent("link_preview_proceed")

    // Abrir em nova aba
    window.open(url, "_blank", "noopener,noreferrer")
    onClose()
  }

  const handleCancel = () => {
    logPreviewEvent("link_preview_cancel")
    onClose()
  }

  const logPreviewEvent = async (eventType: string) => {
    try {
      await fetch("/api/telemetry/link-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: eventType,
          url: url,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Erro ao registrar telemetria:", error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      logPreviewEvent("link_preview_shown")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Você está saindo do site</span>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da imagem */}
          {imageUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <Image src={imageUrl || "/placeholder.svg"} alt={title || "Preview"} fill className="object-cover" />
            </div>
          )}

          {/* Informações do link */}
          <div className="space-y-2">
            {title && <h3 className="font-semibold text-lg">{title}</h3>}
            {description && <p className="text-gray-600 text-sm">{description}</p>}
            <p className="text-orange-600 text-sm font-medium break-all">{url}</p>
          </div>

          {/* Checkbox para não mostrar novamente */}
          <div className="flex items-center space-x-2">
            <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={setDontShowAgain} />
            <label htmlFor="dont-show-again" className="text-sm text-gray-600">
              Sempre prosseguir para {new URL(url).hostname}
            </label>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleProceed} disabled={isLoading} className="flex-1 bg-orange-500 hover:bg-orange-600">
              <ExternalLink className="h-4 w-4 mr-2" />
              Prosseguir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
