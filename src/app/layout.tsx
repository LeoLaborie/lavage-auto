import type { Metadata } from "next";
import { Outfit, Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({ subsets: ["latin"] });
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-cin-sans",
  weight: ["400", "500", "600", "700"],
});
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Nealkar - Lavage auto à domicile",
    template: "%s | Nealkar",
  },
  description: "Réservez votre lavage auto sans eau à domicile en quelques clics. Service professionnel, écologique et pratique partout en France.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Nealkar",
    title: "Nealkar - Lavage auto à domicile",
    description: "Réservez votre lavage auto sans eau à domicile en quelques clics. Service professionnel, écologique et pratique.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nealkar - Lavage auto à domicile",
    description: "Réservez votre lavage auto sans eau à domicile en quelques clics.",
  },
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : `https://${process.env.NEXT_PUBLIC_APP_URL}`) || "https://nealkar.fr"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${interTight.variable} ${inter.variable} ${jbMono.variable}`}>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}