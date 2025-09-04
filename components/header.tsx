"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ShoppingCart, User, Menu, X, LayoutDashboard, LogOut } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { itemCount } = useCart()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="logo-protected flex items-center space-x-2 surreal-glow rounded-lg px-3 py-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-playfair font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Filipe Mavinga E-books
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Início
            </Link>
            <Link href="/loja" className="text-sm font-medium hover:text-primary transition-colors">
              Loja
            </Link>
            {user && (
              <Link href="/publicar" className="text-sm font-medium hover:text-primary transition-colors">
                Publicar
              </Link>
            )}
            <Link href="/sobre" className="text-sm font-medium hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link href="/suporte" className="text-sm font-medium hover:text-primary transition-colors">
              Suporte
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/carrinho">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs bg-orange-600 text-white">
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {!isLoading &&
              (user ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/meu-painel">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painel
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/auth/login">
                    <User className="h-4 w-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
              ))}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/loja"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Loja
              </Link>
              {user && (
                <Link
                  href="/publicar"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Publicar
                </Link>
              )}
              <Link
                href="/sobre"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                href="/suporte"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Suporte
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/carrinho">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Carrinho ({itemCount})
                  </Link>
                </Button>
                {!isLoading &&
                  (user ? (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/meu-painel">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Meu Painel
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" asChild>
                      <Link href="/auth/login">
                        <User className="h-4 w-4 mr-2" />
                        Entrar
                      </Link>
                    </Button>
                  ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
