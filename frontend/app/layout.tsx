import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wrt.app";

export const metadata: Metadata = {
  title: {
    default: "WRT — Work, Relax, Talk",
    template: "%s | WRT",
  },
  description: "Школьная соцсеть. Общайся, участвуй в Class Clash, голосуй за лучшие посты и события школы.",
  keywords: ["школьная соцсеть", "class clash", "школа", "общение", "социальная сеть"],
  authors: [{ name: "WRT" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "WRT",
    title: "WRT — Work, Relax, Talk",
    description: "Школьная соцсеть с Class Clash",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "WRT — Work, Relax, Talk",
    description: "Школьная соцсеть с Class Clash",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
