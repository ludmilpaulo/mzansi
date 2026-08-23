import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { StoreProvider } from "@/store/store-provider";
import { getSiteUrl } from "@/lib/api";
import { generatePageMetadata } from "@/lib/seo";

import "./globals.css";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...generatePageMetadata({
    title: "Mzansi Visa Solutions | South Africa Visa & Immigration Services",
    description:
      "Professional South Africa visa and immigration assistance for temporary residence, permanent residence, waivers, permits and consultations. Government decisions remain with the authorities.",
    path: "/",
  }),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
