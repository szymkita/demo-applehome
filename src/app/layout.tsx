import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppShell } from "@/components/layout/app-shell";

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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <Script id="userback" strategy="afterInteractive">
          {`
            window.Userback = window.Userback || {};
            Userback.access_token = "A-dPBRWG0HtgbzTUu7D5K0JAXNx";
            (function(d) {
              var s = d.createElement('script');s.async = true;s.src = 'https://static.userback.io/widget/v1.js';(d.head || d.body).appendChild(s);
            })(document);
          `}
        </Script>
      </body>
    </html>
  );
}
