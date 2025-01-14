import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "@/components/RootLayoutClient";

export const metadata: Metadata = {
  title: "XAI Agent Platform",
  description: "AI Agent Trading and Communication Platform",
};


export default function RootLayout({
  children,
  
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
}
