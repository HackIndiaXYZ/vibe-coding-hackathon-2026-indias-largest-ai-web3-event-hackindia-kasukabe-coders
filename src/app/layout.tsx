import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MandiMind AI — Agricultural Market Intelligence Platform",
  description:
    "AI-powered mandi intelligence for Farmer Producer Organizations, agri-traders, and procurement companies. Analyze trends, forecast prices, detect market risks, and maximize farmer profits.",
  keywords: ["mandi prices", "agricultural market", "crop price forecast", "FPO", "agri-intelligence"],
  authors: [{ name: "MandiMind AI" }],
  openGraph: {
    title: "MandiMind AI",
    description: "AI Market Intelligence for Smarter Crop Selling Decisions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
