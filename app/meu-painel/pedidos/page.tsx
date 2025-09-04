"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Download, Eye, RefreshCw, Receipt, Calendar } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  total: number
  status: "pending" | "completed" | "failed"
  gateway_ref: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    price: number
    publications: {
      id: string
      title: string
      author_name: string
      cover_url: string
    }
  }[]
}

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items!inner(
            *,
            publications!inner(*)
          )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPayment = async (orderId: string, transactionId?: string) => {
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, transactionId }),
      })

      if (response.ok) {
        // Recarregar pedidos após verificação
        fetchOrders()
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendente
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Pago
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Falhou
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
            <p className="text-orange-700">Carregando seus pedidos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Meus Pedidos</h1>
          <p className="text-orange-700">Acompanhe o status dos seus pedidos e baixe seus e-books</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Nenhum pedido ainda</h3>
              <p className="text-orange-700 mb-6">Explore nossa loja e faça sua primeira compra!</p>
              <Link href="/loja">
                <Button className="bg-orange-600 hover:bg-orange-700">Explorar Loja</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-orange-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-orange-900">Pedido #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-orange-700">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-bold text-orange-600 mt-1">{order.total} AOA</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Lista de itens */}
                  <div className="space-y-3 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-12 h-16 bg-orange-100 rounded overflow-hidden flex-shrink-0">
                          {item.publications.cover_url ? (
                            <img
                              src={item.publications.cover_url || "/placeholder.svg"}
                              alt={item.publications.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Download className="w-4 h-4 text-orange-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900 text-sm">{item.publications.title}</h4>
                          <p className="text-xs text-orange-600">Por {item.publications.author_name}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-orange-500">Qty: {item.quantity}</span>
                            <span className="font-semibold text-orange-600">{item.price} AOA</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === "completed" && (
                      <>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          <Download className="w-3 h-3 mr-1" />
                          Baixar E-books
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                          asChild
                        >
                          <Link href={`/api/orders/${order.id}/receipt`} target="_blank">
                            <Receipt className="w-3 h-3 mr-1" />
                            Ver Recibo
                          </Link>
                        </Button>
                      </>
                    )}

                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyPayment(order.id, order.gateway_ref)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Verificar Pagamento
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Detalhes
                    </Button>
                  </div>

                  {order.gateway_ref && (
                    <div className="mt-3 text-xs text-orange-600">Referência do pagamento: {order.gateway_ref}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
