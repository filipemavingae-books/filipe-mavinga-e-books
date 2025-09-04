import { requireAdmin } from "@/lib/admin-middleware"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Book, ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
  await requireAdmin()

  const supabase = await createClient()

  // Buscar estatísticas gerais
  const [
    { count: totalUsers },
    { count: totalPublications },
    { count: pendingPublications },
    { count: approvedPublications },
    { count: totalOrders },
    { count: completedOrders },
    { data: recentOrders },
    { data: recentPublications },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("publications").select("*", { count: "exact", head: true }),
    supabase.from("publications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("publications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase
      .from("orders")
      .select(`
      *,
      users!inner(username, full_name)
    `)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("publications")
      .select(`
      *,
      users!inner(username, full_name)
    `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // Calcular receita total
  const { data: revenue } = await supabase.from("orders").select("total").eq("status", "completed")

  const totalRevenue = revenue?.reduce((sum, order) => sum + order.total, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Painel Administrativo</h1>
          <p className="text-orange-700">Gerencie o marketplace Filipe Mavinga E-books</p>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <Users className="w-5 h-5" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{totalUsers || 0}</p>
              <p className="text-sm text-orange-700">Total de usuários</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <Book className="w-5 h-5" />
                Publicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{totalPublications || 0}</p>
              <p className="text-sm text-orange-700">
                {approvedPublications || 0} aprovadas, {pendingPublications || 0} pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{totalOrders || 0}</p>
              <p className="text-sm text-orange-700">{completedOrders || 0} completados</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <DollarSign className="w-5 h-5" />
                Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{totalRevenue.toFixed(2)} AOA</p>
              <p className="text-sm text-orange-700">Total em vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Ações Rápidas</CardTitle>
              <CardDescription className="text-orange-700">Gerencie o marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/publicacoes">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Book className="w-4 h-4 mr-2" />
                  Gerenciar Publicações
                </Button>
              </Link>
              <Link href="/admin/usuarios">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </Link>
              <Link href="/admin/pedidos">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ver Pedidos
                </Button>
              </Link>
              <Link href="/admin/logs">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Logs de Auditoria
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Publicações pendentes */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Clock className="w-5 h-5" />
                Publicações Pendentes
              </CardTitle>
              <CardDescription className="text-orange-700">Aguardando aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPublications && recentPublications.length > 0 ? (
                <div className="space-y-3">
                  {recentPublications.map((pub: any) => (
                    <div key={pub.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-orange-900 text-sm truncate">{pub.title}</p>
                        <p className="text-xs text-orange-600">Por {pub.users.full_name || pub.users.username}</p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">
                        Pendente
                      </Badge>
                    </div>
                  ))}
                  <Link href="/admin/publicacoes">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 bg-transparent"
                    >
                      Ver Todas
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-orange-600">Nenhuma publicação pendente</p>
              )}
            </CardContent>
          </Card>

          {/* Pedidos recentes */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <ShoppingCart className="w-5 h-5" />
                Pedidos Recentes
              </CardTitle>
              <CardDescription className="text-orange-700">Últimas transações</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-orange-900 text-sm">
                          {order.users.full_name || order.users.username}
                        </p>
                        <p className="text-xs text-orange-600">{order.total} AOA</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${
                          order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "completed" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/admin/pedidos">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 bg-transparent"
                    >
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-orange-600">Nenhum pedido recente</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
