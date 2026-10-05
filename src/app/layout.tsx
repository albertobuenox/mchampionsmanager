import type { Metadata } from "next";
import { Exo_2, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const exo = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo",
  weight: ["700", "800"],
  style: ["normal", "italic"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "MChampions Manager",
  description: "Gestión y personalización de cartas para Marvel Champions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${exo.variable} ${sourceSans.variable} h-full`}>
      <body className="min-h-full bg-[#f3efe6] text-[#1a1612] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
