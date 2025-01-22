import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/Toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XAI Agent Platform",
  description: "AI Agent Trading and Communication Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1 flex flex-col bg-background">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
