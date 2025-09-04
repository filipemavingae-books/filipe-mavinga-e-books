import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Book, Home } from "lucide-react"
import Link from "next/link"

function SucessoContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-orange-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-orange-900">Compra Realizada!</CardTitle>
              <CardDescription className="text-orange-700">Seu pedido foi processado com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Próximos passos:</h3>
                <ol className="list-decimal list-inside text-sm text-orange-700 space-y-1 text-left">
                  <li>Aguarde a confirmação do pagamento via KuEnha Pay</li>
                  <li>Você receberá um e-mail com os links de download</li>
                  <li>Seus e-books estarão disponíveis no seu painel</li>
                  <li>Aproveite sua leitura!</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Link href="/meu-painel">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Download className="w-4 h-4 mr-2" />
                    Ir para Meu Painel
                  </Button>
                </Link>

                <Link href="/loja">
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    Continuar Comprando
                  </Button>
                </Link>

                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-orange-600">
                <p>Dúvidas? Entre em contato com nosso suporte.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SucessoContent />
    </Suspense>
  )
}
