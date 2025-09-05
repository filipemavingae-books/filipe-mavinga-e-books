"use client"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Book, ShoppingCart, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function MeuPainelPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Buscar estatísticas
  const { data: publications } = await supabase.from("publications").select("*").eq("user_id", user.id)

  const { data: orders } = await supabase.from("orders").select("*").eq("buyer_id", user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Meu Painel</h1>
          <p className="text-orange-700">Bem-vindo de volta, {userData?.full_name || user.email}!</p>
        </div>

        {/* Informações do usuário */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>UUID:</strong> {userData?.uuid}
            </p>
            <p>
              <strong>Username:</strong> {userData?.username}
            </p>
            <p>
              <strong>E-mail:</strong> {user.email}
            </p>
            <p>
              <strong>Membro desde:</strong> {new Date(userData?.created_at || "").toLocaleDateString("pt-BR")}
            </p>
            <p>
              <strong>Último acesso:</strong>{" "}
              {userData?.last_login_at
                ? new Date(userData.last_login_at).toLocaleDateString("pt-BR")
                : "Primeiro acesso"}
            </p>
            <div className="mt-4">
              <Link href={`/perfil/${userData?.username}-${userData?.uuid}`}>
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Ver Perfil Público
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <Book className="w-5 h-5" />
                Publicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{publications?.length || 0}</p>
              <p className="text-sm text-orange-700">E-books publicados</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{orders?.length || 0}</p>
              <p className="text-sm text-orange-700">E-books comprados</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <DollarSign className="w-5 h-5" />
                Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">767,04 AOA</p>
              <p className="text-sm text-orange-700">Total em vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Ações Rápidas</CardTitle>
              <CardDescription className="text-orange-700">Gerencie seu conteúdo e vendas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/publicar">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Publicar Novo E-book</Button>
              </Link>
              <Link href="/meu-painel/publicacoes">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Gerenciar Publicações
                </Button>
              </Link>
              <Link href="/meu-painel/pedidos">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Meus Pedidos
                </Button>
              </Link>
              <Link href="/loja">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Explorar Loja
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Suporte</CardTitle>
              <CardDescription className="text-orange-700">Precisa de ajuda? Estamos aqui!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/suporte">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  Central de Suporte
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                onClick={() => {
                  // Aqui será implementado o chat da IA
                  alert("Chat de suporte será implementado na próxima etapa!")
                }}
              >
                Chat com IA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
