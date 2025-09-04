import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, DollarSign, Shield, Zap, Users, TrendingUp, Search } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-muted/30 to-background">
          <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <Badge variant="secondary" className="mb-4">
                🚀 Plataforma Inovadora de E-books
              </Badge>

              <h1 className="font-playfair font-bold text-4xl md:text-6xl lg:text-7xl text-balance leading-tight">
                Transforme{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Leitores
                </span>{" "}
                em{" "}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Autores
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                Publique seus e-books por apenas <strong className="text-primary">500 Kz</strong>, venda com links
                únicos por <strong className="text-primary">767,04 AOA</strong> e receba via KuEnha Pay. Com IA
                integrada e preview inteligente.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="hover-lift surreal-glow" asChild>
                  <Link href="/publicar">
                    <Upload className="mr-2 h-5 w-5" />
                    Publicar E-book
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="hover-lift bg-transparent" asChild>
                  <Link href="/loja">
                    <Search className="mr-2 h-5 w-5" />
                    Explorar Loja
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair font-bold text-3xl md:text-4xl mb-4">Por que escolher nossa plataforma?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Oferecemos tudo que você precisa para publicar, vender e gerenciar seus e-books com segurança e
                eficiência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Publicação Simples</CardTitle>
                  <CardDescription>
                    Publique seu e-book por apenas 500 Kz. Processo rápido e aprovação profissional.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Vendas Seguras</CardTitle>
                  <CardDescription>
                    Venda por 767,04 AOA com pagamentos via KuEnha Pay. Links únicos e seguros.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Proteção Total</CardTitle>
                  <CardDescription>UUID único, marca d'água digital e sistema anti-pirataria avançado.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>IA Integrada</CardTitle>
                  <CardDescription>
                    Suporte inteligente, geração de conteúdo e recomendações personalizadas.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Sistema de Afiliados</CardTitle>
                  <CardDescription>Ganhe comissões indicando autores. Links únicos baseados em UUID.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-lift border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Analytics Completo</CardTitle>
                  <CardDescription>Relatórios detalhados, logs auditáveis e métricas de performance.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">E-books Publicados</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-secondary">1000+</div>
                <div className="text-sm text-muted-foreground">Autores Ativos</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-accent">5000+</div>
                <div className="text-sm text-muted-foreground">Vendas Realizadas</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime Garantido</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="font-playfair font-bold text-3xl md:text-4xl">
                Pronto para começar sua jornada como autor?
              </h2>
              <p className="text-lg text-muted-foreground">
                Junte-se a milhares de autores que já transformaram suas ideias em e-books de sucesso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="hover-lift surreal-glow" asChild>
                  <Link href="/cadastro">Criar Conta Gratuita</Link>
                </Button>
                <Button variant="outline" size="lg" className="hover-lift bg-transparent" asChild>
                  <Link href="/sobre">Saiba Mais</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
