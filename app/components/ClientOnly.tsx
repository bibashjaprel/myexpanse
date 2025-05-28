// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { GeistSans, GeistMono } from 'geist/font'
import ClientOnly from './ClientOnly'
import Navbar from './Navbar'

export const metadata: Metadata = {
  title: 'MyExpense',
  description: 'Track your money easily',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ClientOnly>
          <Navbar />
        </ClientOnly>
        {children}
      </body>
    </html>
  )
}
