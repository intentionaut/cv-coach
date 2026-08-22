import type { Metadata } from "next";
import { Epilogue, Rosario, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/layout/Footer";

const epilogue = Epilogue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rosario = Rosario({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Friday - Film Industry Career Platform",
  description: "AI-powered CV tailoring and interview coaching for film students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${epilogue.variable} ${rosario.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-046F7P2YBS" />
    </html>
  );
}
