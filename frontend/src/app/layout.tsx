import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/ThemeProvider";

import { ClickEffectProvider } from "@/components/ClickEffectProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoML | AI Data Science Copilot",
  description: "Automated EDA and AI-assisted dataset analysis",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={['light', 'dark', 'galactic']}
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClickEffectProvider>
            <MainLayout>{children}</MainLayout>
          </ClickEffectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
