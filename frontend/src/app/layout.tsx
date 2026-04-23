import type { Metadata } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StudyOS - AI-Powered Co-Study Platform',
  description: 'Invite-only, AI-powered co-study platform for CS university friend groups',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${space.variable} ${jetbrains.variable} font-ui antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}