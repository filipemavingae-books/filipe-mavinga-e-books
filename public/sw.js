// Service Worker para cache offline e interceptação de requisições
const CACHE_NAME = "fmebooks-v1.0.0"
const STATIC_CACHE = "fmebooks-static-v1"
const DYNAMIC_CACHE = "fmebooks-dynamic-v1"
const EBOOKS_CACHE = "fmebooks-ebooks-v1"

// Recursos para cache inicial
const STATIC_ASSETS = [
  "/",
  "/loja",
  "/carrinho",
  "/auth/login",
  "/auth/cadastro",
  "/publicar",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...")

  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches
        .open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(STATIC_ASSETS)
        }),

      // Pular espera para ativar imediatamente
      self.skipWaiting(),
    ]),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...")

  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== EBOOKS_CACHE) {
                console.log("[SW] Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),

      // Tomar controle imediatamente
      self.clients.claim(),
    ]),
  )
})

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições não-HTTP
  if (!request.url.startsWith("http")) return

  // Estratégias diferentes por tipo de recurso
  if (isStaticAsset(url)) {
    // Cache First para recursos estáticos
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isEbookFile(url)) {
    // Cache First para e-books comprados
    event.respondWith(cacheFirst(request, EBOOKS_CACHE))
  } else if (isAPIRequest(url)) {
    // Network First para APIs com fallback
    event.respondWith(networkFirstWithFallback(request))
  } else {
    // Stale While Revalidate para páginas
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  }
})

// Background Sync para fila offline
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "offline-queue") {
    event.waitUntil(processOfflineQueue())
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event.data?.text())

  const options = {
    body: event.data?.text() || "Nova notificação do Filipe Mavinga E-books",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "fmebooks-notification",
    requireInteraction: true,
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
  }

  event.waitUntil(self.registration.showNotification("Filipe Mavinga E-books", options))
})

// Clique em notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Funções auxiliares
function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)
}

function isEbookFile(url) {
  return url.pathname.match(/\.(epub|pdf|mobi)$/) || url.pathname.includes("/ebooks/")
}

function isAPIRequest(url) {
  return url.pathname.startsWith("/api/")
}

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("[SW] Cache first failed:", error)
    return new Response("Offline", { status: 503 })
  }
}

async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error)

    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback para página offline
    if (request.mode === "navigate") {
      return caches.match("/offline.html")
    }

    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "Sem conexão com a internet",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

async function processOfflineQueue() {
  try {
    // Abrir IndexedDB e processar fila
    const db = await openDB()
    const tx = db.transaction(["offlineQueue"], "readonly")
    const store = tx.objectStore("offlineQueue")
    const items = await store.getAll()

    for (const item of items) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        })

        // Remover item processado
        const deleteTx = db.transaction(["offlineQueue"], "readwrite")
        const deleteStore = deleteTx.objectStore("offlineQueue")
        await deleteStore.delete(item.id)

        console.log("[SW] Processed offline item:", item.id)
      } catch (error) {
        console.log("[SW] Failed to process offline item:", error)
      }
    }
  } catch (error) {
    console.log("[SW] Error processing offline queue:", error)
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FMEbooksDB", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains("offlineQueue")) {
        const store = db.createObjectStore("offlineQueue", { keyPath: "id", autoIncrement: true })
        store.createIndex("timestamp", "timestamp")
      }

      if (!db.objectStoreNames.contains("ebooks")) {
        const ebooksStore = db.createObjectStore("ebooks", { keyPath: "id" })
        ebooksStore.createIndex("userId", "userId")
      }

      if (!db.objectStoreNames.contains("userData")) {
        db.createObjectStore("userData", { keyPath: "key" })
      }
    }
  })
}
