import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import Header from "../components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juvo PDF Processing",
  description: "Professional PDF processing solution by Juvo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col bg-gradient-to-b from-anti-flash-white to-lace-cap`}
      >
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow relative isolate">{children}</main>
        </div>
      </body>
    </html>
  );
}
