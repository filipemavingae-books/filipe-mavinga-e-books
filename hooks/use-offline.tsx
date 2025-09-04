"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface OfflineContextType {
  isOnline: boolean
  isOfflineMode: boolean
  syncStatus: "idle" | "syncing" | "complete" | "error"
  offlineQueue: number
  addToOfflineQueue: (data: any) => void
  syncNow: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "complete" | "error">("idle")
  const [offlineQueue, setOfflineQueue] = useState(0)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[App] Service Worker registered:", registration)
        })
        .catch((error) => {
          console.log("[App] Service Worker registration failed:", error)
        })
    }

    // Inicializar Web Worker
    if (typeof Worker !== "undefined") {
      const offlineWorker = new Worker("/offline-worker.js")

      offlineWorker.onmessage = (event) => {
        const { type, data } = event.data

        switch (type) {
          case "sync-complete":
            setSyncStatus("complete")
            setOfflineQueue(0)
            setTimeout(() => setSyncStatus("idle"), 3000)
            break

          case "new-publication":
            // Atualizar UI com nova publicação
            console.log("[App] New publication received:", data)
            break

          case "notification":
            // Mostrar notificação
            console.log("[App] Notification received:", data)
            break

          default:
            console.log("[App] Unknown worker message:", type)
        }
      }

      setWorker(offlineWorker)

      return () => {
        offlineWorker.terminate()
      }
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsOfflineMode(false)
      console.log("[App] Network online")
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsOfflineMode(true)
      console.log("[App] Network offline")
    }

    // Estado inicial
    setIsOnline(navigator.onLine)
    setIsOfflineMode(!navigator.onLine)

    // Escutar mudanças de rede
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const addToOfflineQueue = (data: any) => {
    if (worker) {
      worker.postMessage({ type: "add-to-queue", data })
      setOfflineQueue((prev) => prev + 1)
    }
  }

  const syncNow = () => {
    if (worker && isOnline) {
      setSyncStatus("syncing")
      worker.postMessage({ type: "sync-now" })
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineMode,
        syncStatus,
        offlineQueue,
        addToOfflineQueue,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider")
  }
  return context
}
