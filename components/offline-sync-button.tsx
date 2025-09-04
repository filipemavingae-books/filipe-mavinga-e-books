"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useOffline } from "@/hooks/use-offline"
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineSyncButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function OfflineSyncButton({ className, size = "default", variant = "outline" }: OfflineSyncButtonProps) {
  const { isOnline, syncStatus, offlineQueue, syncNow } = useOffline()
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const handleSync = () => {
    syncNow()
    setLastSync(new Date())
  }

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    if (syncStatus === "syncing") return <RefreshCw className="h-4 w-4 animate-spin" />
    if (syncStatus === "complete") return <CheckCircle className="h-4 w-4" />
    if (syncStatus === "error") return <AlertCircle className="h-4 w-4" />
    return <Wifi className="h-4 w-4" />
  }

  const getText = () => {
    if (!isOnline) return "Offline"
    if (syncStatus === "syncing") return "Sincronizando..."
    if (syncStatus === "complete") return "Sincronizado"
    if (syncStatus === "error") return "Erro"
    if (offlineQueue > 0) return `Sincronizar (${offlineQueue})`
    return "Sincronizar"
  }

  const getVariant = () => {
    if (!isOnline) return "destructive"
    if (syncStatus === "error") return "destructive"
    if (syncStatus === "complete") return "default"
    return variant
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={handleSync}
        disabled={!isOnline || syncStatus === "syncing"}
        size={size}
        variant={getVariant()}
        className={cn("flex items-center gap-2", className)}
      >
        {getIcon()}
        {getText()}
      </Button>

      {lastSync && syncStatus === "complete" && (
        <span className="text-xs text-muted-foreground">
          Última sincronização:{" "}
          {lastSync.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  )
}
