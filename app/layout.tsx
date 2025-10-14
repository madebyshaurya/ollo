import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const editorialNew = localFont({
  src: [
    {
      path: '../public/fonts/PPEditorialNew-Variable.ttf',
      style: 'normal',
    },
    {
      path: '../public/fonts/PPEditorialNew-ItalicVariable.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-editorial-new',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ollo',
  description: 'AI-powered hardware build companion that guides makers from idea to completion.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${editorialNew.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
