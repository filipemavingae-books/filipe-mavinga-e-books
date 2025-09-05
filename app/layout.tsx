import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartProvider } from "@/hooks/use-cart"
import { AIChatWidget } from "@/components/ai-chat-widget"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Filipe Mavinga E-books - Transforme Leitores em Autores",
  description:
    "Publique seus e-books por apenas 500 Kz, venda com links únicos por 767,04 AOA. Marketplace seguro com IA integrada e preview inteligente.",
  generator: "Filipe Mavinga E-books",
  keywords: ["e-books", "publicação", "marketplace", "Angola", "Filipe Mavinga"],
  authors: [{ name: "Filipe Mavinga" }],
  openGraph: {
    title: "Filipe Mavinga E-books",
    description: "Transforme leitores em autores. Publique e venda e-books com segurança.",
    type: "website",
    locale: "pt_AO",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-AO">
      <body className={`font-sans ${playfairDisplay.variable} ${sourceSans.variable} antialiased`}>
        <CartProvider>
          <Header />
          <main>
            <Suspense fallback={null}>{children}</Suspense>
          </main>
          <Footer />
          <AIChatWidget />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
