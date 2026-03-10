import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { SeedInit } from "@/components/layout/seed-init";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SerwisPro — System Obsługi Serwisu",
  description: "Profesjonalny system zarządzania serwisem urządzeń mobilnych",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SeedInit>
            <div className="flex min-h-dvh">
              <Sidebar />
              <main className="flex-1 lg:pl-[250px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
                  {children}
                </div>
              </main>
            </div>
          </SeedInit>
        </ThemeProvider>
      </body>
    </html>
  );
}
