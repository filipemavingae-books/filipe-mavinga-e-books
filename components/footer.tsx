import Link from "next/link"
import { BookOpen, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="logo-protected flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-playfair font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Filipe Mavinga E-books
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transforme leitores em autores. Publique seus e-books por apenas 500 Kz, venda com links únicos e receba
              via KuEnha Pay.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Links Rápidos</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/loja" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Explorar E-books
              </Link>
              <Link href="/publicar" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Publicar E-book
              </Link>
              <Link href="/sobre" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sobre Nós
              </Link>
              <Link href="/suporte" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Suporte
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/termos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Cookies
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Contato</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contato@filipemavinga.ao</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+244 900 000 000</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Luanda, Angola</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2024 Filipe Mavinga E-books. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
