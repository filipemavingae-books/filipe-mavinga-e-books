"use client"

import { useOffline } from "@/hooks/use-offline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, isOfflineMode, syncStatus, offlineQueue, syncNow } = useOffline()

  if (isOnline && syncStatus === "idle" && offlineQueue === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {/* Status de conexão */}
      {isOfflineMode && (
        <Badge variant="destructive" className="flex items-center gap-2">
          <WifiOff className="h-3 w-3" />
          Modo Offline
        </Badge>
      )}

      {/* Status de sincronização */}
      {syncStatus !== "idle" && (
        <Badge
          variant={syncStatus === "complete" ? "default" : syncStatus === "error" ? "destructive" : "secondary"}
          className="flex items-center gap-2"
        >
          {syncStatus === "syncing" && <RefreshCw className="h-3 w-3 animate-spin" />}
          {syncStatus === "complete" && <CheckCircle className="h-3 w-3" />}
          {syncStatus === "error" && <AlertCircle className="h-3 w-3" />}

          {syncStatus === "syncing" && "Sincronizando..."}
          {syncStatus === "complete" && "Sincronizado"}
          {syncStatus === "error" && "Erro na sincronização"}
        </Badge>
      )}

      {/* Fila offline */}
      {offlineQueue > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            {offlineQueue} pendente{offlineQueue > 1 ? "s" : ""}
          </Badge>

          {isOnline && (
            <Button size="sm" variant="outline" onClick={syncNow} disabled={syncStatus === "syncing"}>
              <Wifi className="h-3 w-3 mr-1" />
              Sincronizar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
