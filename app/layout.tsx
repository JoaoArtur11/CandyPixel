import type { Metadata, Viewport } from "next";
import { Fredoka, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-candy",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CANDY PIXEL - Plataforma 2D de Ação",
  description:
    "Em um mundo feito de doces invadido por alimentos saudáveis, você é o último rebelde açucarado. Devore os doces, desvie dos vilões verdes e derrote o Alface Gigante no QG das Verduras.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFC0DE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${fredoka.variable} ${spaceMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
