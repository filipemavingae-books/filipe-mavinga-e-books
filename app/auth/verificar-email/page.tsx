import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900">Verifique seu E-mail</CardTitle>
            <CardDescription className="text-orange-700">
              Enviamos um link de confirmação para seu e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-orange-700">
              Clique no link enviado para ativar sua conta e começar a usar o Filipe Mavinga E-books.
            </p>
            <p className="text-xs text-orange-600">Não recebeu o e-mail? Verifique sua caixa de spam.</p>
            <Link
              href="/auth/login"
              className="inline-block text-sm font-medium text-orange-600 hover:text-orange-500 underline"
            >
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
