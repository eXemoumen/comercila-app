"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AndroidOfflineStatus } from "@/components/AndroidOfflineStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add debugging for mobile app

    // Check if we're in a Capacitor environment
    if (
      typeof window !== "undefined" &&
      (window as { Capacitor?: unknown }).Capacitor
    ) {
    } else {
    }
  }, []);

  return (
    <html lang="fr">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className={inter.className}>
        {children}
        <AndroidOfflineStatus />
        <OfflineIndicator />
      </body>
    </html>
  );
}
