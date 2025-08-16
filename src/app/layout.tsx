"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add debugging for mobile app
    console.log("App starting...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("User Agent:", navigator.userAgent);
    console.log(
      "Is Mobile:",
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );

    // Check if we're in a Capacitor environment
    if (
      typeof window !== "undefined" &&
      (window as { Capacitor?: unknown }).Capacitor
    ) {
      console.log("Running in Capacitor environment");
    } else {
      console.log("Running in web environment");
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
