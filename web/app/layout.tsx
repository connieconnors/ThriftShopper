import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Merriweather } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import PWARegister from "./components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ThriftShopper — the magic of discovery™",
  description: "Discover unique vintage and thrift finds",
  manifest: "/manifest.json",
  themeColor: "#191970",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ThriftShopper",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${merriweather.variable} antialiased`}
      >
        <PWARegister />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
