"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/hooks/use-cart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, CreditCard, User, AlertCircle, Book, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Angola",
  })

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Buscar dados do usuário
      const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (userData) {
        setBillingInfo((prev) => ({
          ...prev,
          fullName: userData.full_name || "",
          email: user.email || "",
        }))
      }
    }

    getUser()
  }, [router])

  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (items.length === 0) {
      router.push("/carrinho")
    }
  }, [items, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Validações
      if (!billingInfo.fullName || !billingInfo.email || !billingInfo.phone) {
        throw new Error("Preencha todos os campos obrigatórios")
      }

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          total: total,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Criar itens do pedido
      const orderItems = items.map((item) => ({
        order_id: order.id,
        publication_id: item.id,
        price: item.price,
        quantity: item.quantity || 1,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Registrar log
      await supabase.from("event_logs").insert({
        user_id: user.id,
        event_type: "order_created",
        reference_id: order.id,
        metadata: {
          total: total,
          items_count: items.length,
          billing_info: billingInfo,
        },
      })

      // Redirecionar para KuEnha Pay
      const paymentUrl = `https://pay.kuenha.com/59e228dc-0a24-45d5-a613-62dce8c096fc?amount=${total}&currency=AOA&description=Compra de E-books - Filipe Mavinga E-books&reference=${order.id}&customer_name=${encodeURIComponent(billingInfo.fullName)}&customer_email=${encodeURIComponent(billingInfo.email)}`

      // Limpar carrinho
      clearCart()

      // Abrir pagamento em nova aba
      window.open(paymentUrl, "_blank")

      // Redirecionar para página de sucesso
      router.push(`/checkout/sucesso?order=${order.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return null // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/carrinho">
              <Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Carrinho
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-orange-900">Finalizar Compra</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações de cobrança */}
            <div className="space-y-6">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <User className="w-5 h-5" />
                    Informações de Cobrança
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    Preencha seus dados para finalizar a compra
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-orange-900">
                        Nome Completo *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        required
                        value={billingInfo.fullName}
                        onChange={handleInputChange}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-orange-900">
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={billingInfo.email}
                        onChange={handleInputChange}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-orange-900">
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={billingInfo.phone}
                        onChange={handleInputChange}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="+244 900 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-orange-900">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={billingInfo.city}
                        onChange={handleInputChange}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="Luanda"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-orange-900">
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={billingInfo.address}
                      onChange={handleInputChange}
                      className="border-orange-200 focus:border-orange-500"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Método de pagamento */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <CreditCard className="w-5 h-5" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-orange-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">KP</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-900">KuEnha Pay</h4>
                        <p className="text-sm text-orange-700">Pagamento seguro e rápido</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo do pedido */}
            <div className="space-y-6">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <ShoppingCart className="w-5 h-5" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de itens */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-12 h-16 bg-orange-100 rounded overflow-hidden flex-shrink-0">
                          {item.cover_url ? (
                            <img
                              src={item.cover_url || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Book className="w-4 h-4 text-orange-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900 text-sm line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-orange-600">Por {item.author}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-orange-500">Qty: {item.quantity || 1}</span>
                            <span className="font-semibold text-orange-600">{item.price} AOA</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-orange-200" />

                  {/* Totais */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Subtotal</span>
                      <span className="font-medium text-orange-900">{total.toFixed(2)} AOA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Taxa de processamento</span>
                      <span className="font-medium text-orange-900">0,00 AOA</span>
                    </div>
                    <Separator className="bg-orange-200" />
                    <div className="flex justify-between">
                      <span className="font-semibold text-orange-900">Total</span>
                      <span className="font-bold text-xl text-orange-600">{total.toFixed(2)} AOA</span>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
                  >
                    {isLoading ? "Processando..." : "Finalizar Compra"}
                  </Button>

                  <div className="text-xs text-orange-600 text-center space-y-1">
                    <p>Ao finalizar a compra, você será redirecionado para o KuEnha Pay</p>
                    <p>Seus e-books estarão disponíveis após a confirmação do pagamento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
