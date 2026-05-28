import type { Metadata, Viewport } from "next";

import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "./context/AuthContext";

import PWARegister from "./components/PWARegister";

import { PostHogProvider } from "./providers/PostHogProvider";



const inter = Inter({

  variable: "--font-ui",

  subsets: ["latin"],

  weight: ["400", "500", "600"],

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



export const metadata: Metadata = {

  title: "ThriftShopper — the magic of discovery™",

  description: "Discover unique vintage and thrift finds",

  manifest: "/manifest.json",

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



export const viewport: Viewport = {

  themeColor: "#ede9e1",

  viewportFit: "cover",

};



export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode;

}>) {

  return (

    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${playfair.variable}`}
    >

      <body className="antialiased">

        <PostHogProvider>

          <PWARegister />

          <AuthProvider>

            {children}

          </AuthProvider>

        </PostHogProvider>

      </body>

    </html>

  );

}

