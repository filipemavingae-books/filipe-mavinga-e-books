// Web Worker para gerenciamento offline
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.websocket = null

    this.init()
  }

  init() {
    // Monitorar estado da rede
    self.addEventListener("online", () => {
      console.log("[Worker] Network online")
      this.isOnline = true
      this.reconnectAttempts = 0
      this.connectWebSocket()
      this.syncOfflineData()
    })

    self.addEventListener("offline", () => {
      console.log("[Worker] Network offline")
      this.isOnline = false
      this.closeWebSocket()
    })

    // Conectar WebSocket se online
    if (this.isOnline) {
      this.connectWebSocket()
    }

    // Verificar conexão periodicamente
    setInterval(() => {
      this.checkConnection()
    }, 30000)
  }

  connectWebSocket() {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsUrl = self.location.origin.replace("http", "ws") + "/ws"
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log("[Worker] WebSocket connected")
        this.reconnectAttempts = 0
        this.sendMessage("worker-connected", { timestamp: Date.now() })
      }

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        this.handleWebSocketMessage(data)
      }

      this.websocket.onclose = () => {
        console.log("[Worker] WebSocket closed")
        this.scheduleReconnect()
      }

      this.websocket.onerror = (error) => {
        console.log("[Worker] WebSocket error:", error)
        this.scheduleReconnect()
      }
    } catch (error) {
      console.log("[Worker] WebSocket connection failed:", error)
      this.scheduleReconnect()
    }
  }

  closeWebSocket() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  scheduleReconnect() {
    if (!this.isOnline || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      if (this.isOnline) {
        this.connectWebSocket()
      }
    }, delay)
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "new-publication":
        this.cachePublication(data.publication)
        this.notifyMainThread("new-publication", data.publication)
        break

      case "order-update":
        this.updateOrderStatus(data.order)
        this.notifyMainThread("order-update", data.order)
        break

      case "notification":
        this.storeNotification(data.notification)
        this.notifyMainThread("notification", data.notification)
        break

      default:
        console.log("[Worker] Unknown message type:", data.type)
    }
  }

  async checkConnection() {
    try {
      // Tentar fazer uma requisição leve para verificar conectividade
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      })

      if (!response.ok && this.isOnline) {
        console.log("[Worker] Connection check failed, going offline")
        this.isOnline = false
        this.closeWebSocket()
      } else if (response.ok && !this.isOnline) {
        console.log("[Worker] Connection restored")
        this.isOnline = true
        this.connectWebSocket()
        this.syncOfflineData()
      }
    } catch (error) {
      if (this.isOnline) {
        console.log("[Worker] Connection lost")
        this.isOnline = false
        this.closeWebSocket()
      }
    }
  }

  async syncOfflineData() {
    try {
      const db = await this.openDB()
      const tx = db.transaction(["offlineQueue"], "readonly")
      const store = tx.objectStore("offlineQueue")
      const items = await this.getAll(store)

      console.log(`[Worker] Syncing ${items.length} offline items`)

      for (const item of items) {
        try {
          await this.processOfflineItem(item)
          await this.removeOfflineItem(item.id)
        } catch (error) {
          console.log("[Worker] Failed to sync item:", error)
        }
      }

      this.notifyMainThread("sync-complete", { itemsProcessed: items.length })
    } catch (error) {
      console.log("[Worker] Sync failed:", error)
    }
  }

  async processOfflineItem(item) {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.body,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response
  }

  async addToOfflineQueue(data) {
    try {
      const db = await this.openDB()
      const tx = db.transaction(["offlineQueue"], "readwrite")
      const store = tx.objectStore("offlineQueue")

      const item = {
        ...data,
        timestamp: Date.now(),
        retries: 0,
      }

      await this.add(store, item)
      console.log("[Worker] Added to offline queue:", item)

      // Registrar background sync
      if ("serviceWorker" in self && "sync" in self.ServiceWorkerRegistration.prototype) {
        const registration = await self.navigator.serviceWorker.ready
        await registration.sync.register("offline-queue")
      }
    } catch (error) {
      console.log("[Worker] Failed to add to offline queue:", error)
    }
  }

  async cachePublication(publication) {
    try {
      const db = await this.openDB()
      const tx = db.transaction(["publications"], "readwrite")
      const store = tx.objectStore("publications")
      await this.put(store, publication)
    } catch (error) {
      console.log("[Worker] Failed to cache publication:", error)
    }
  }

  async storeNotification(notification) {
    try {
      const db = await this.openDB()
      const tx = db.transaction(["notifications"], "readwrite")
      const store = tx.objectStore("notifications")
      await this.add(store, {
        ...notification,
        timestamp: Date.now(),
        read: false,
      })
    } catch (error) {
      console.log("[Worker] Failed to store notification:", error)
    }
  }

  notifyMainThread(type, data) {
    self.postMessage({ type, data })
  }

  sendMessage(type, data) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ type, data }))
    }
  }

  // IndexedDB helpers
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FMEbooksDB", 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Offline queue
        if (!db.objectStoreNames.contains("offlineQueue")) {
          const store = db.createObjectStore("offlineQueue", { keyPath: "id", autoIncrement: true })
          store.createIndex("timestamp", "timestamp")
        }

        // Publications cache
        if (!db.objectStoreNames.contains("publications")) {
          const store = db.createObjectStore("publications", { keyPath: "id" })
          store.createIndex("status", "status")
        }

        // Notifications
        if (!db.objectStoreNames.contains("notifications")) {
          const store = db.createObjectStore("notifications", { keyPath: "id", autoIncrement: true })
          store.createIndex("timestamp", "timestamp")
        }

        // User data
        if (!db.objectStoreNames.contains("userData")) {
          db.createObjectStore("userData", { keyPath: "key" })
        }
      }
    })
  }

  getAll(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  add(store, data) {
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  put(store, data) {
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeOfflineItem(id) {
    const db = await this.openDB()
    const tx = db.transaction(["offlineQueue"], "readwrite")
    const store = tx.objectStore("offlineQueue")

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Inicializar o gerenciador offline
const offlineManager = new OfflineManager()

// Escutar mensagens do thread principal
self.addEventListener("message", (event) => {
  const { type, data } = event.data

  switch (type) {
    case "add-to-queue":
      offlineManager.addToOfflineQueue(data)
      break

    case "sync-now":
      offlineManager.syncOfflineData()
      break

    case "send-message":
      offlineManager.sendMessage(data.type, data.payload)
      break

    default:
      console.log("[Worker] Unknown message type:", type)
  }
})
