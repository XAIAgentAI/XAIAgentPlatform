'use client';

import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import DebugStyles from "@/components/DebugStyles";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <DebugStyles />
      </body>
    </html>
  );
} 