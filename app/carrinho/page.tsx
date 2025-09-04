"use client"

import { useCart } from "@/hooks/use-cart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Plus, Minus, Book, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) return
    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-orange-900 mb-8">Carrinho de Compras</h1>

            <Card className="border-orange-200">
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-orange-900 mb-2">Seu carrinho está vazio</h3>
                <p className="text-orange-700 mb-6">Explore nossa loja e adicione e-books incríveis ao seu carrinho!</p>
                <Link href="/loja">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Book className="w-4 h-4 mr-2" />
                    Explorar Loja
                  </Button>
                </Link>
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-orange-900">Carrinho de Compras</h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de itens */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Capa */}
                      <div className="w-20 h-28 bg-orange-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.cover_url ? (
                          <img
                            src={item.cover_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="w-6 h-6 text-orange-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Link
                              href={`/${item.username}/publicacao/${item.id}`}
                              className="font-semibold text-orange-900 hover:text-orange-700 transition-colors"
                            >
                              {item.title}
                            </Link>
                            <p className="text-sm text-orange-600">Por {item.author}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-orange-600">{item.price} AOA</span>

                            {/* Controles de quantidade (para e-books, geralmente 1) */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                disabled={(item.quantity || 1) <= 1}
                                className="w-8 h-8 p-0 border-orange-300"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity || 1}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                disabled={true} // E-books são únicos
                                className="w-8 h-8 p-0 border-orange-300"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              {(item.price * (item.quantity || 1)).toFixed(2)} AOA
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Ações do carrinho */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Carrinho
                </Button>

                <Link href="/loja">
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="lg:col-span-1">
              <Card className="border-orange-200 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-orange-900">Resumo do Pedido</CardTitle>
                  <CardDescription className="text-orange-700">Confira os detalhes da sua compra</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">
                        Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})
                      </span>
                      <span className="font-medium text-orange-900">{total.toFixed(2)} AOA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Taxa de processamento</span>
                      <span className="font-medium text-orange-900">0,00 AOA</span>
                    </div>
                    <div className="border-t border-orange-200 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-orange-900">Total</span>
                        <span className="font-bold text-xl text-orange-600">{total.toFixed(2)} AOA</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCheckout} className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3">
                    Finalizar Compra
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="text-xs text-orange-600 text-center">Pagamento seguro via KuEnha Pay</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
