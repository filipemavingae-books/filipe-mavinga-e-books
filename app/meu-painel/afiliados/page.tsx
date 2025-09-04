"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, DollarSign, Users, TrendingUp, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AffiliateStats {
  total_earnings: number
  pending_earnings: number
  total_referrals: number
  conversion_rate: number
  clicks: number
}

interface AffiliateEarning {
  id: string
  amount: number
  status: string
  created_at: string
  publication_title: string
  buyer_name: string
}

export default function AfiliadosPage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([])
  const [affiliateCode, setAffiliateCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadAffiliateData()
  }, [])

  const loadAffiliateData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Buscar dados do afiliado
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("affiliate_code")
        .eq("user_id", user.id)
        .single()

      if (profile) {
        setAffiliateCode(profile.affiliate_code)
      }

      // Buscar estatísticas
      const { data: statsData } = await supabase.rpc("get_affiliate_stats", { user_uuid: user.id })

      if (statsData) {
        setStats(statsData)
      }

      // Buscar ganhos
      const { data: earningsData } = await supabase
        .from("affiliate_earnings")
        .select(
          `
          *,
          orders!affiliate_earnings_order_id_fkey (
            order_items (
              publications (title)
            ),
            user_profiles!orders_buyer_id_fkey (full_name)
          )
        `,
        )
        .eq("affiliate_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (earningsData) {
        const formattedEarnings = earningsData.map((earning: any) => ({
          id: earning.id,
          amount: earning.amount,
          status: earning.status,
          created_at: earning.created_at,
          publication_title: earning.orders?.order_items?.[0]?.publications?.title || "N/A",
          buyer_name: earning.orders?.user_profiles?.full_name || "Anônimo",
        }))
        setEarnings(formattedEarnings)
      }
    } catch (error) {
      console.error("Erro ao carregar dados de afiliado:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyAffiliateLink = (publicationId?: string) => {
    const baseUrl = window.location.origin
    const link = publicationId
      ? `${baseUrl}/loja?ref=${affiliateCode}&pub=${publicationId}`
      : `${baseUrl}/loja?ref=${affiliateCode}`

    navigator.clipboard.writeText(link)
    // Aqui você poderia adicionar um toast de sucesso
  }

  const requestWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) return

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("affiliate_withdrawals").insert({
        affiliate_id: user.id,
        amount: Number.parseFloat(withdrawAmount),
        status: "pending",
      })

      if (!error) {
        setWithdrawAmount("")
        loadAffiliateData() // Recarregar dados
        // Toast de sucesso
      }
    } catch (error) {
      console.error("Erro ao solicitar saque:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Programa de Afiliados</h1>
        <p className="text-gray-600">Ganhe comissões indicando e-books para seus seguidores</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.total_earnings || 0).toLocaleString("pt-AO")} AOA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.pending_earnings || 0).toLocaleString("pt-AO")} AOA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_referrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.conversion_rate || 0).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList>
          <TabsTrigger value="links">Meus Links</TabsTrigger>
          <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          <TabsTrigger value="withdraw">Sacar</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seus Links de Afiliado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Código de Afiliado</label>
                <div className="flex space-x-2 mt-1">
                  <Input value={affiliateCode} readOnly />
                  <Button variant="outline" size="icon" onClick={() => copyAffiliateLink()}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Link Geral da Loja</label>
                <div className="flex space-x-2 mt-1">
                  <Input value={`${window.location.origin}/loja?ref=${affiliateCode}`} readOnly />
                  <Button variant="outline" size="icon" onClick={() => copyAffiliateLink()}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Como funciona?</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Compartilhe seus links de afiliado</li>
                  <li>• Ganhe 10% de comissão em cada venda</li>
                  <li>• Pagamentos processados semanalmente</li>
                  <li>• Saque mínimo de 5.000 AOA</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum ganho ainda. Comece a compartilhar seus links!
                  </p>
                ) : (
                  earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{earning.publication_title}</p>
                        <p className="text-sm text-gray-600">Comprador: {earning.buyer_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(earning.created_at).toLocaleDateString("pt-AO")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{earning.amount.toLocaleString("pt-AO")} AOA</p>
                        <Badge variant={earning.status === "paid" ? "default" : "secondary"}>{earning.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Valor Disponível para Saque</label>
                <p className="text-2xl font-bold text-green-600">
                  {(stats?.pending_earnings || 0).toLocaleString("pt-AO")} AOA
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Valor do Saque</label>
                <Input
                  type="number"
                  placeholder="Mínimo 5.000 AOA"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <Button
                onClick={requestWithdraw}
                disabled={
                  !withdrawAmount ||
                  Number.parseFloat(withdrawAmount) < 5000 ||
                  Number.parseFloat(withdrawAmount) > (stats?.pending_earnings || 0)
                }
                className="w-full"
              >
                Solicitar Saque
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Informações sobre Saques</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Saque mínimo: 5.000 AOA</li>
                  <li>• Processamento: até 3 dias úteis</li>
                  <li>• Taxa de processamento: 2%</li>
                  <li>• Pagamento via transferência bancária</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
