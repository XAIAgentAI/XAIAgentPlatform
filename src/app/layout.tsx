

// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { headers } from "next/headers"; // added
import { Inter } from "next/font/google";

import ContextProvider from '../../context/index'
import { Toaster } from "@/components/Toaster";

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "XAI Agent Platform",
  description: "AI Agent Trading and Communication Platform"
};
const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookies = headers().get('cookie')

  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} flex flex-col min-h-screen`}>
        <ContextProvider cookies={cookies}>
          <Navbar />
          <main className="flex-1 flex flex-col bg-background">
            {children}
          </main>
          <Toaster />

        </ContextProvider>


      </body>

    </html>
  )
}