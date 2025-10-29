import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import "../styles/globals.css";
import { APP_CONFIG } from "@/utils/constants";
import React from 'react';
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - ${APP_CONFIG.description}`,
  description: `${APP_CONFIG.description} for ${APP_CONFIG.collegeName}`,
  keywords: ["attendance", "education", "management", "student", "faculty"],
  authors: [{ name: APP_CONFIG.collegeName }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <div id="app-root" className="min-h-full">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
